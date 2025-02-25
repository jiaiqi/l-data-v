import { Message } from 'element-ui';
import { evalActionValidator, resolveDefaultSrvApp } from './common.js'

const common_page_path = {
  detail: "/vpages/#/detail",
  list: "/vpages/#/list",
  "simple-add": "/vpages/#/simple-add",
  "simple-update": "/vpages/#/simple-update",
  "start-proc": "/vpages/#/startproc",
  procdetail: "/vpages/#/procdetail",
  procdetail_v2: "/vpages/#/v2/procdetail",
  "start-proc_v2": "/vpages/#/v2/startproc",
  editgrid: "/vpages/#/editgrid",
  explain: "/vpages/#/explain?",
  report: "/vpages/#/reportList",
};

/**
 * 根据各种参数确定是否显示按钮。
 *
 * @param {Object} params - 用于确定按钮是否显示的参数。
 * @param {Object} params.item - 按钮项对象。
 * @param {number} params.rowIndex - 行的索引。
 * @param {Object} params.rowData - 行的数据。
 * @param {Object} params.mainData - 主表数据。
 * @param {string} params.listType - 列表的类型（例如，“mine”）。
 * @param {boolean} params.showBatchEditButton - 指示是否显示批量编辑按钮的标志。
 * @returns {boolean} - 如果按钮应显示，则返回 true，否则返回 false。
 */
export function getButtonDisplay(params) {
  const { item, rowIndex, rowData, mainData, listType, showBatchEditButton } = params
  var result = true;

  // 催办按钮只在 我的申请 页面显示
  if (listType !== "mine" && item.button_type === "urge") {
    return false;
  }

  try {
    var disp_exps = item.disp_exps;
    if (disp_exps !== undefined && disp_exps !== "" && disp_exps !== null) {
      result = eval(disp_exps);
    }
  } catch (err) {
    console.error("Error evaluating disp_exps:", err);
  }

  // 使用后端返回的参数控制按钮显示隐藏
  if (
    item._rowDisp &&
    typeof rowIndex === "number" &&
    [0, 1].includes(item._rowDisp[rowIndex])
  ) {
    result = item._rowDisp[rowIndex];
  }

  if (
    item.button_type === "batchupdate" &&
    showBatchEditButton !== true
  ) {
    result = false;
  }
  return result;
}

export function getButtonOptSrv(params) {
  const { btn, row, type, mainData } = params;
  let self = this;
  let serviceName = "";
  let serviceViewName = "";
  let permission = false;
  let operateList = [];
  let isBtnOptShow = false;
  let isBtnExpShow = false;
  let data = row;
  if (
    btn.permission &&
    btn.operate_service &&
    Object.prototype.toString.call(btn.operate_service) !==
    "[object String]"
  ) {
    for (let key in btn.operate_service) {
      let config = btn.operate_service[key];
      let args = ["e", "b"];
      let isValid = eval(config.disp_exps);
      if (config.permission) {
        operateList.push({
          serviceName: key,
          serviceViewName: config.service_view_name,
          permission: config.permission,
          isValid: isValid,
        });
      }
    }
  }
  let dispExps = btn.disp_exps;
  if (btn.permission && dispExps) {
    let args = ["e", "b"];
    isBtnExpShow = eval(dispExps);
  } else {
    isBtnExpShow = btn.permission;
  }
  if (type && type == "isShow" && isBtnExpShow) {
    let optionsList = operateList.filter((item) => item.isValid);
    if (
      btn.permission &&
      (optionsList.length !== 0 ||
        (btn.operate_service &&
          Object.prototype.toString.call(btn.operate_service) ==
          "[object String]") ||
        !btn.operate_service)
    ) {
      isBtnOptShow = true;
    } else {
      isBtnOptShow = false;
    }
    // console.log('getButtonOptSrv isshow',btn.button_name ,isBtnExpShow && isBtnOptShow,isBtnExpShow,isBtnOptShow)
    return isBtnExpShow && isBtnOptShow;
  } else if (type && type == "active") {
    let opIsShow = operateList.filter((item) => item.isValid);
    return opIsShow;
  } else {
    let opIsShow = operateList.filter((item) => item.isValid);
    return opIsShow;
  }
}




export function deleteRowData(params) {
  const { row, service } = params;
  console.log("deleteRowData", row, service);
  let isDel = confirm('确认删除？')
  if (isDel) {
    return {
      type: 'deleteRowData',
      row,
      service
    }
  } else {
    return {
      type:'cancel'
    }
  }
}

/**
 * 处理表格行操作按钮点击事件
 * @param {Object} params - 参数集合
 * @param {Object} params.operate_item - 操作按钮配置对象
 * @param {Object} params.row - 当前行数据对象
 * @param {Object} params.mainData - 主表数据对象
 * @param {boolean} params.draftRun - 是否草稿模式
 * @param {Function} params.handler - 事件处理函数
 * @param {Object} params.pub_field_map - 公共字段映射表
 * @param {Object} params.vm - Vue实例上下文
 * @returns {Object} 返回包含激活按钮和服务名的对象
 */
export async function rowButtonClick(params) {
  const { operate_item, row, mainData, draftRun, handler, pub_field_map, searchFormCondition, storageType, vm } = params;
  let self = this;
  let button = operate_item;
  var type = operate_item.button_type;
  // console.log(type)
  var exeservice = operate_item.service_name;
  var tab_title = operate_item.service_view_name;
  // this.clickedRow = row
  let returnData = {
    activeRowButton: operate_item,
    rowButtonActiveServiceName: "",
  };
  if (
    button.hasOwnProperty("always_show") &&
    button.always_show &&
    !button.permission
  ) {
    // 无权限的按钮永久显示，操作弹出配置提示信息
    Message({
      type: 'warning',
      message: button.tip_msg || "您无法进行该操作",
      confirmButtonText: "确定",
    })
    return;
  }
  if (
    button.action_validate &&
    evalActionValidator(button.action_validate, row) !== true
  ) {
    return;
  }

  var operate_service = operate_item.operate_service;
  if (operate_service) {
    exeservice = operate_service;
  }

  if ("delete" == type) {
    let result = deleteRowData({ row, service: exeservice });
    if (result?.type) {
      return { ...returnData, ...result }
    }
  } else if ("edit" == type) {
    if (
      button.operate_service &&
      Object.prototype.toString.call(button.operate_service) !==
      "[object String]"
    ) {
      let srv = getButtonOptSrv(button, row, "active");
      if (srv.length > 0) {
        returnData.rowButtonActiveServiceName = srv[0].serviceName;
      } else {
      }
    } else {
      returnData.rowButtonActiveServiceName =
        button.operate_service || button.service_name;
    }
    let actionConfig = getButtonOptSrv(button, row, "active");
    console.log("getButtonOptSrv", actionConfig);
    onUpdateClicked(row);
  } else if ("detail" == type) {
    var urlParams =
      "/" +
      exeservice +
      "/" +
      row.id +
      "?srvApp=" +
      resolveDefaultSrvApp() +
      "&isdraft=" +
      draftRun; //跳转
    if (pub_field_map?.id) {
      urlParams =
        "/" +
        exeservice +
        "/" +
        row[pub_field_map.id] +
        "?srvApp=" +
        resolveDefaultSrvApp() +
        "&isdraft=" +
        draftRun; //跳转
    }
    // 公共详情按钮传分表参数规则
    let divCond = searchFormCondition?.filter?.((item) => item.use_div_calc === "是")
      .map((item) => {
        return {
          colName: item.colName,
          ruleType: item.ruleType,
          value: item.value,
        };
      });
    if (button?.more_config?.includes("divCond")) {
      try {
        const moreConfig = JSON.parse(button.more_config);
        if (moreConfig?.divCond?.colName) {
          const evalCondValue = (value, row = {}, mainData = {}) => {
            if (!value || typeof value === "string") {
              return value;
            } else if (value?.value_type === "rowData" && value.value_key) {
              return row[value.value_key];
            } else if (
              value?.value_type === "mainData" &&
              value.value_key
            ) {
              return mainData[value.value_key];
            } else if (value?.value_type === "constant" && value.value) {
              return value.value;
            }
          };
          const mainDetailData = mainData || {};

          divCond = [
            {
              colName: moreConfig.divCond.colName,
              ruleType: "between",
              value: [
                evalCondValue(
                  moreConfig.divCond.start_value,
                  row,
                  mainDetailData
                ),
                evalCondValue(
                  moreConfig.divCond.end_value,
                  row,
                  mainDetailData
                ),
              ],
            },
          ];
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (!divCond?.length && buildDivCond?.()?.length) {
      divCond = buildDivCond();
    }
    if (divCond?.length) {
      // 分表查询条件 2024.1.12新增，传到详情页面
      const divObj = divCond[0];
      if (
        divCond?.length === 1 &&
        Array.isArray(divObj?.value) &&
        divObj.value.length > 1
      ) {
        // 直接将分表参数拼接到url上
        urlParams += `&divCol=${divObj.colName}&divStartVal=${divObj.value[0]}&divEndVal=${divObj.value[1]}`;
      } else {
        // 分表参数以数组格式传到url上
        urlParams += `&divCond=${encodeURIComponent(
          JSON.stringify(divCond)
        )}`;
      }
    }
    var disp_col = operate_item._disp_col;
    var disp_value = row[disp_col]; //详情页面上的标签
    tab_title = tab_title.replace("查询", "");
    if (disp_value != null && disp_value != undefined && disp_value != "") {
      tab_title = disp_value + "(" + tab_title + "详情)";
    } else {
      tab_title = tab_title + "详情";
    }
    addTab({
      type: "detail",
      urlParams,
      tab_title,
      srv: exeservice,
      button,
      vm,
    });
  } else if ("procdetail" == type) {
    const urlParams = `/${row['proc_instance_no']}?srvApp=${resolveDefaultSrvApp()}`;
    // "/" +
    // row["proc_instance_no"] +
    // "?srvApp=" +
    // resolveDefaultSrvApp();
    // addTab("procdetail", urlParams, tab_title, null, button);
    addTab({
      type: "procdetail",
      urlParams,
      tab_title,
      srv: exeservice,
      button,
      vm,
    })
  } else if ("addchild" == type) {
    onAddChildClicked(row);
  } else if ("duplicate" == type) {
    if (storageType === "mem") {
      returnData.activeData = row;
    } else {
      returnData.activeData = null;
    }

    return {
      ...returnData,
      ...onDuplicateClicked(row)
    };
  } else if ("duplicatedeep" == type) {
    onDuplicateDeepClicked(row);
  } else if ("closeproc" == type) {
    procOperate(row, operate_item);
  } else if ("proccancel" == type) {
    procOperate(row, operate_item);
  } else if ("deleteproc" == type) {
    procOperate(row, operate_item);
  } else if ("startproc" == type) {
    //开启数据流程
    start_dataproc(row, operate_item);
  } else if ("deletedraft" == type) {
    procOperate(row, operate_item);
  } else if ("extjs" === type) {
    operate_item.handlerFunc && operate_item.handlerFunc(row);
  } else if ("manage_childlist" === type) {
    onPopupMemListClick(row, button);
  } else if ("urge" == type) {
    //催办
    procOperate(row, operate_item);
  } else if ("customize" == type) {
    if (button.hasOwnProperty("version") && button.version == "v2") {
      customButtonV2(button, row);
    } else {
      let data = [row];
      if (operate_item.operate_type == "修改") {
        customize_update(operate_item, data);
      } else if (operate_item.operate_type == "删除") {
        customize_delete(operate_item, data);
      } else if (operate_item.operate_type == "增加") {
        customize_add(operate_item, data);
      } else {
        operate_item.listservice = service;
        customizeOperate(operate_item, data, (e) => {
          // dialog操作完成之后的回调 刷新列表
          // this.loadTableData();
        });
      }
    }

    // let pageKey = {
    //   service: operate_item.service,
    //   buttonsKey: `${operate_item["operate_service"]}-${operate_item.id}`,
    //   buttonType: operate_item.operate_type,
    //   buttonMode: operate_item.servcie_type,
    //   submitState: false,
    // };
    // console.log(operate_item);
    // this.$store.commit("setTableButtonsPopup", {
    //   ...pageKey,
    // });
    // 初始化弹出表单状态
  } else if ("batch_approve" == type) {
    // 流程批量审批
    onBatchApprove([row], button);
  } else if ("customize_import" == type) {
    // 自定义导入
    onCustomizeImport(row, button);
  }
}

export function buildDivCond() {
  return [];
}


export function getVersionNo(vm) {
  var version = "";
  var path = vm?.$route.path;
  var paths = vm?.$route.path.split("/");
  if (paths.length > 1) {
    var reg = /^v\d*$/;
    var value = paths[1];
    if (reg.test(value)) {
      version = value;
    }
  }
  return version;
};


export function addTab(params) {
  const { type, urlParams, tab_title, srv, button, app, vm } = params;
  console.log("addTab", type, urlParams, tab_title, srv, button, app);
  if (tab_title == undefined || tab_title == null || tab_title == "") {
    tab_title = "新标页签";
  }
  let srvName = srv || null;
  let url = common_page_path[type] + urlParams;
  var versionNo = getVersionNo(vm);
  if (versionNo != "" && ("procdetail" == type || "start-proc" == type)) {
    type = type + "_" + versionNo;
    url = common_page_path[type] + urlParams;
    if (app) {
      if (url.indexOf("?") !== -1) {
        url = `${url}&srvApp=${app}&time=${new Date().getTime()}`;
      } else {
        url = `${url}?srvApp=${app}&time=${new Date().getTime()}`;
      }
    }
  }

  if (type === "explain") {
    // 自定义 字段说明页面的参数
    url = common_page_path[type] + "?data=" + urlParams;
  } else if (type === "report") {
    url = common_page_path[type] + "?operate_params=" + urlParams;
  } else if (type === "list") {
    let params = JSON.parse(urlParams);
    url =
      common_page_path[type] + "/" + srvName + "?operate_params=" + urlParams;
  }

  let more_config = "";
  if (button && button.more_config) {
    more_config = button.more_config;
  }
  if (window.top.tab) {
    let page = {
      title: tab_title,
      url: url,
      icon: "",
    };

    if (more_config && more_config.indexOf("openInCurrentTab") !== -1) {
      // window.location.href = url
      // window.top.tab.replaceTab(page);
      window.top.tab.addTab(page);
    } else {
      window.top.tab.addTab(page);
    }
  } else {
    window.open(url);
  }
};

export function onAddChildClicked(row) {
  console.log("onAddChildClicked", row);
}

export function onUpdateClicked(row) {
  console.log("onUpdateClicked", row);
}

export function onDuplicateClicked(row) {
  console.log("onDuplicateClicked", row);
  return {
    type: 'onDuplicateClicked',
    row
  }
}

export function onDuplicateDeepClicked(row) {
  console.log("onDuplicateDeepClicked", row);
}

export function procOperate(row, operate_item) {
  console.log("procOperate", row, operate_item);
}

export function customButtonV2(row, operate_item) {
  console.log("customButtonV2", row, operate_item);
}

export function customize_update(operate_item, data) {
  console.log("customize_update", operate_item, data);
}

export function customize_delete(operate_item, data) {
  console.log("customize_delete", operate_item, data);
}

export function customize_add(operate_item, data) {
  console.log("customize_add", operate_item, data);
}
export function customizeOperate(operate_item, data, callback) {
  console.log("customizeOperate", operate_item, data, callback);
}

export function onBatchApprove(data, button) {
  console.log("onBatchApprove", data, button);
}

export function onCustomizeImport(row, button) {
  console.log("onCustomizeImport", row, button);
}
