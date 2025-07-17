import { Message } from 'element-ui';
import { evalActionValidator, resolveDefaultSrvApp } from './common.js'
import { $http } from '@/common/http.js'
import { cloneDeep } from 'lodash-es';
import dayjs from 'dayjs';
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
      type: 'cancel'
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
    return {
      type: "detail",
    }
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
    return {
      type: "procdetail",
    }
  } else if ("addchild" == type) {
    onAddChildClicked(row);
    return {
      row: row,
      type:'addchild'
    }
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
        }, params);
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
  let { type, urlParams, tab_title, srv, button, app, vm } = params;
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
export function customizeOperate(operate_item, data, callback, params) {
  console.log("customizeOperate", operate_item, data, callback);
  const operateData = data;
  const butinfo = operate_item;
  if (butinfo.btn_cfg_json) {
    butinfo.btn_cfg = butinfo.btn_cfg_json;
    try {
      butinfo.btn_cfg = JSON.parse(butinfo.btn_cfg_json);
    } catch (e) {
      //TODO handle the exception
    }
    if (butinfo?.btn_cfg?.sys_func === "支付") {
      butinfo.more_config = "showDetailQR";
      customizeurlFoward(butinfo, operateData, params);
      return;
    }
  }
  let type = butinfo.button_type;
  var application = butinfo.application;
  var operate_type = butinfo.operate_type;
  if (type == "batchadd") {
    customize_popup(butinfo, operateData, params);
    return;
  } else {
  }
  if (operate_type == "操作") {
    customize_operate(butinfo, operateData, params);
  } else if (operate_type == "流程申请") {
    customize_apply(butinfo, operateData, params);
  } else if (operate_type == "修改") {
    customize_update(butinfo, operateData, params);
  } else if (operate_type == "删除") {
    customize_delete(butinfo, operateData, params);
  } else if (operate_type == "增加") {
    customize_add(butinfo, operateData, params);
  } else if (operate_type == "草稿") {
    return customize_save(butinfo, operateData, params);
  } else if (operate_type.endsWith("URL跳转")) {
    customizeurlFoward(butinfo, operateData, params);
  } else if (operate_type.endsWith("地址访问")) {
    addressRequest(butinfo, operateData, params);
  } else if (operate_type.endsWith("跳转")) {
    customize_forward(butinfo, operateData, params);
  } else if (operate_type.endsWith("弹出")) {
    customize_popup(butinfo, operateData, callback, params);
  } else if (operate_type === "选择填充表格") {
    customize_popup(butinfo, operateData, params);
  } else {
    alert("暂未实现");
  }
}

/**
 * url跳转打开tab页签
 */
export async function customizeurlFoward(item, operateData, params = {}) {
  var mainDetailData = params?.listMainFormDatas || null;
  var address = "";
  // 处理展示二维码按钮配置
  if (
    item?.btn_cfg?.options &&
    item?.btn_cfg?.options.indexOf("展示二维码") !== -1 &&
    item?.btn_cfg?.jump_json
  ) {
    const button = item;
    let row = operateData[0];
    let jump_json = item?.btn_cfg?.jump_json;
    let url = `/views/custom/index/index?page_no=${jump_json?.dest_page_no}`;
    if (jump_json?.tmpl_page_json?.file_path) {
      url =
        jump_json?.tmpl_page_json?.file_path +
        "?page_no=" +
        jump_json?.dest_page_no;
    }
    if (
      Array.isArray(jump_json?.cols_map_json?.cols_map_detail_json) &&
      jump_json?.cols_map_json?.cols_map_detail_json.length > 0
    ) {
      jump_json?.cols_map_json?.cols_map_detail_json.forEach((item) => {
        if (item.from_type === "当前数据") {
          url += `&${item.col_to}=${row[item.col_from]}`;
        } else {
          url += `&${item.col_to}=${renderStr(item.col_from, {
            button,
            row,
            data: row,
          })}`;
        }
      });
    }
    let detailUrl = `${window.location.origin
      }/h5/?target_nav_url=${encodeURIComponent(url)}`;
    if (url?.indexOf("webview://") === 0) {
      url = url.replace("webview://", "");
      url = `/views/public/webview/webview?src=${encodeURIComponent(url)}`;
      detailUrl = `${window.location.origin
        }/h5/#/views/public/webview/webview?target_nav_url=${encodeURIComponent(
          url
        )}`;
    } else if (url?.includes("http")) {
      detailUrl = url;
    }

    const detailUrlImage = `${this.serviceApi().qrcode
      }?content=${encodeURIComponent(detailUrl)}&width=300`;

    this.$alert(
      `<p style="text-align:center;"><img src="${detailUrlImage}" style="margin:0 auto;" /></p>`,
      item?.btn_cfg?.qrcode_tips || "请打开微信扫码进行操作",
      {
        dangerouslyUseHTMLString: true,
        center: true,
        // showCancelButton:true,
        // distinguishCancelAndClose:true,
        confirmButtonText: "保存二维码",
        callback: (action) => {
          if (action === "confirm") {
            // 保存二维码
            fetch(detailUrlImage)
              .then((response) => response.blob())
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "二维码.jpg";
                a.click();
                URL.revokeObjectURL(url);
              });
          }
        },
      }
    );
    return;
  }
  var back_url = url_pre_data_handle(
    item,
    {
      operateData,
      mainDetailData,
      ...params
    }
  );
  if (back_url != "") {
    address = back_url;
  } else {
    var url = item["operate_params"];
    if (url != "" && url != null && url != undefined) {
      var urls = url.split("/");
      var index = 0;
      for (var step of urls) {
        if (step.startsWith("{") && step.endsWith("}")) {
          var col_key = step.substring(1, step.length - 1);
          if (operateData.length > 0) {
            urls[index] = operateData[0][col_key];
          }
        }
        index++;
      }
      address = urls.join("/");
    } else if (item.more_config) {
      // 2023.10.25 jiaqi 通过请求获取跳转url
      try {
        const moreConfig = JSON.parse(item.more_config);
        if (moreConfig?.urlFromReq) {
          const url = `${window.backendIpAddr}${moreConfig?.urlFromReq?.url}`;
          const req = moreConfig?.urlFromReq?.data;
          if (moreConfig?.urlFromReq?.type === "redirect") {
            let rUrl = url;
            if (
              moreConfig?.urlFromReq?.data &&
              Object.keys(moreConfig?.urlFromReq?.data)?.length
            ) {
              // 拼query参数 json to queryString
              Object.keys(moreConfig?.urlFromReq?.data).forEach((key) => {
                let value = moreConfig?.urlFromReq?.data[key];
                if (value === "${currentUrl}") {
                  value = encodeURIComponent(top.window.location.href);
                }
                if (rUrl?.includes("?")) {
                  rUrl += `&${key}=${value}`;
                } else {
                  rUrl += `?${key}=${value}`;
                }
              });
            }
            if (!rUrl?.includes("bx_auth_ticket")) {
              rUrl += `&bx_auth_ticket=${sessionStorage.getItem(
                "bx_auth_ticket"
              )}`;
            }
            window.open(rUrl);
          } else if (url && req && moreConfig?.urlFromReq?.method) {
            const res = await $http[moreConfig?.urlFromReq?.method](
              url,
              req
            );
            if (res?.data?.data?.length) {
              const resData = res.data.data[0];
              address = resData[moreConfig?.urlFromReq?.field];
            }
          }
        }
      } catch (error) { }
    }
  }

  let more_config = "";
  if (item && item.more_config) {
    more_config = item.more_config;
  }
  let divQueryString = buildCustomBtnDivCondUrl(item, operateData, mainDetailData)
  if (divQueryString) {
    if (address.indexOf("?") > -1) {
      address += `&${divQueryString}`
    } else {
      address += `?${divQueryString}`
    }
  }
  if ("新TAB" == item.operate_mode) {
    window.open(address, "_blank");
  } else {
    let _tab_title = item.service_view_name;

    if (!_tab_title && params?.service_view_name) {
      _tab_title = `${item.button_name}(${params.service_view_name})`;
    }
    if (item.tabTitle) {
      _tab_title = item.tabTitle;
    }

    // if(_tab_title==null||_tab_title==""||_tab_title==undefined){
    //   _tab_title=item.button_name;
    // }
    forwardAddTab(address, _tab_title, item);
  }
}

/**
* url跳转前置处理
*/
export function url_pre_data_handle(item, params) {
  const mainDetailData = params?.mainDetailData
  const operateData = params?.operateData
  const self = params?.vm || {}
  if (params?.vm && !params.vm?.service && params?.vm?.serviceName) {
    params.vm.service = params.vm.serviceName
  }
  const srvApp = params?.srvApp || resolveDefaultSrvApp()
  if (!top.pathConfig) {
    top.pathConfig = {}
  }
  if (!top.pathConfig?.gateway) {
    top.pathConfig.gateway = window.backendIpAddr
  }
  var back_url = "";
  var pre_data_handle = item.pre_data_handle;
  if (
    pre_data_handle != undefined &&
    pre_data_handle != null &&
    pre_data_handle != ""
  ) {
    // var mainDetailData = self.listMainFormDatas || null
    back_url = eval(
      "var zz=" + pre_data_handle + "(operateData,mainDetailData,self); zz"
    );
    // back_url = eval(pre_data_handle);
    if (back_url && back_url.indexOf("srvApp") == -1 && back_url.includes(location.hostname)) {
      // 只有域名/ip跟当前页面一样时才追加srvApp参数
      let opt = "&";
      if (back_url.indexOf("?") == -1) {
        opt = "?";
      }
      back_url = `${back_url}${opt}srvApp=${srvApp
        ? srvApp
        : item.application && item.application !== "this"
          ? item.application
          : ""
        }`;
    }
  }
  return back_url;
}
export function onBatchApprove(data, button) {
  console.log("onBatchApprove", data, button);
}

export function onCustomizeImport(row, button) {
  console.log("onCustomizeImport", row, button);
}

export const addTabByUrl = function (url, tab_title, urlParams, type) {
  url = url || common_page_path[type] + "?data=" + urlParams;
  let page = {
    title: tab_title || "新标页签",
    url,
  };

  if (window.top.tab && window.top.tab.addTab) {
    window.top.tab.addTab(page);
  } else {
    let strWindowFeatures =
      "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
    let newWindow = window.open(url, "CNN_WindowName", strWindowFeatures);
    newWindow.document.title = tab_title;
  }
};

/**操作*/
export const forwardAddTab = function (address, tab_title, button) {
  if (tab_title == undefined || tab_title == null || tab_title == "") {
    tab_title = "新标页签";
  }

  let page = {
    title: tab_title,
    url: address,
    icon: "",
  };

  if (
    button &&
    button.more_config &&
    button.more_config.indexOf("openInCurrentTab") !== -1
  ) {
    // window.location.href = address
    window.top.tab.replaceTab(page);
    return;
  }

  window.top?.tab?.addTab?.(page) ?? window.open(address, "_blank");
};

/**操作*/
export const custAddTab = function (type, urlParams, tab_title, button) {
  if (tab_title == undefined || tab_title == null || tab_title == "") {
    tab_title = "新标页签";
  }

  let page = {
    title: tab_title,
    url: common_page_path[type] + urlParams,
    icon: "",
  };

  let more_config = "";
  if (button && button.more_config) {
    more_config = button.more_config;
  }
  if (more_config && more_config.indexOf("openInCurrentTab") !== -1) {
    window.top?.tab?.addTab?.(page) ?? open(page.url, "_blank");
    return;
  }
  window.top?.tab?.addTab?.(page) ?? open(page.url, "_blank");
};


export const renderStr = (str, obj = {}) => {
  if (typeof obj === "object" && str && typeof str === "string") {
    str = str.replace(/\$\{(.*?)\}/g, (match, key) => {
      key = key.trim();
      let result = obj[key];
      let arr = key.split(".");
      if (arr?.length) {
        result = obj;
        arr.forEach((item) => {
          try {
            result =
              result[item] || result[item] === false || result[item] === 0
                ? result[item]
                : "";
            if (result === 0) {
              result = "0";
            }
          } catch (e) {
            //TODO handle the exception
          }
        });
      }
      return result;
    });
  }
  return str;
};

export const queryString2Obj = (url) => {
  let search = url.split("?")[1];
  if (url.indexOf("?") == -1) {
    search = url;
  }
  if (!search) {
    return {};
  }
  return JSON.parse(
    '{"' +
    decodeURIComponent(search)
      .replace(/"/g, '\\"')
      .replace(/&/g, '","')
      .replace(/=/g, '":"') +
    '"}'
  );
};

/**
 * 将queryString格式的divCond转为数组格式
 * @param {*} url
 */
export const urlDivCondToArray = (url) => {
  if (
    url &&
    url?.includes("divCol") &&
    url.includes("divStartVal") &&
    url.includes("divEndVal")
  ) {

    const obj = queryString2Obj(url);
    return [
      {
        colName: obj.divCol,
        ruleType: "between",
        value: [obj.divStartVal, obj.divEndVal],
      },
    ];
  }
  return url;
};
/**
 * 构建自定义按钮配置的divCond 输出为queryString格式
 * @param {*} btn 自定义按钮
 * @param {*} row 行数据或者详情数据
 * @param {*} mainData 详情页面 点击子表时按钮传入的主表数据
 * @returns { string } 返回divCol,divStartVal,divEndVal组成的queryString
 */
export const buildCustomBtnDivCondUrl = (btn, row, mainData) => {
  const result = buildCustomBtnDivCond(btn, row, mainData);
  if (
    Array.isArray(result) &&
    result.length &&
    result[0]?.value?.length > 1
  ) {
    return `divCol=${result[0].colName}&divStartVal=${result[0].value[0]}&divEndVal=${result[0].value[1]}`;
  }
};
/**
 * 构建自定义按钮配置的divCond
 * @param {*} btn 自定义按钮
 * @param {*} row 行数据或者详情数据
 * @param {*} mainData 详情页面 点击子表时按钮传入的主表数据
 * @returns { Array } 返回一个长度为1的数组
 */
export const buildCustomBtnDivCond = (btn, row = {}, mainData = {}) => {
  let result = null;
  if (Array.isArray(row) && row.length) {
    row = JSON.parse(JSON.stringify(row[0]));
  }
  const evalCondValue = (value, row) => {
    if (!value || typeof value === "string") {
      return value;
    } else if (value?.value_type === "rowData" && value.value_key) {
      return row[value.value_key];
    } else if (value?.value_type === "mainData" && value.value_key) {
      return mainData[value.value_key];
    } else if (value?.value_type === "constant" && value.value) {
      return value.value;
    }
  };
  if (btn?.more_config) {
    try {
      const moreConfig = JSON.parse(btn.more_config);
      if (moreConfig?.divCond?.colName) {
        moreConfig.divCond = [moreConfig.divCond];
      }
      if (Array.isArray(moreConfig?.divCond) && moreConfig.divCond?.length) {
        result = moreConfig.divCond.map((item) => {
          const obj = {
            colName: item.colName,
            ruleType: "between",
            value: [],
          };
          let val1, val2;
          if (item.start_value) {
            val1 = evalCondValue(item.start_value, row);
          }
          if (item.end_value) {
            val2 = evalCondValue(item.end_value, row);
          }
          if (val1 && val2) {
            obj.value = [val1, val2];
          } else if (val1 || val2) {
            obj.value = [val1 || val2];
          }
          return obj;
        });
      }
    } catch (error) { }
  }
  return result;
};


/**
 * 自定义跳转
 * @param {*} item
 * @param {*} operateData
 */
export function customize_forward(item, operateData, params = {}) {
  pre_data_handle(item, operateData);

  var me = params?.vm || {};
  var service = item["operate_service"];

  var operate_type = item["operate_type"];
  var page_type = "";
  var bxRequests = [];

  var operate_params = JSON.parse(item["operate_params"]);
  if (operate_params != "" && operate_params != null) {
    var request = {};

    request["serviceName"] = item["operate_service"];

    var colNames = operate_params["colNames"];
    if (colNames != undefined && colNames != null && colNames != null) {
      request["colNames"] = colNames;
    }

    var order = operate_params["order"];
    if (order != undefined && order != null && order != null) {
      request["order"] = order;
    }

    var page = operate_params["page"];
    if (page != undefined && page != null && page != null) {
      request["page"] = page;
    }

    var data = operate_params["data"];

    var packageData = getPackageData(item, operateData, params);
    var new_data = packageData["data"];
    var new_conditions = packageData["conditions"];
    var requestData = [];
    request["data"] = requestData;
    if (JSON.stringify(new_data) == "{}") {
    } else {
      requestData.push(new_data);
    }

    request["condition"] = new_conditions;
    bxRequests.push(request);
  }

  var operate_params_str = "";
  if (bxRequests.length > 0) {
    operate_params_str = encodeURI(JSON.stringify(bxRequests[0]));
  }

  var urlParams = "/" + service;

  if ("列表跳转" == operate_type) {
    page_type = "list";
  } else if ("详情跳转" == operate_type) {
    page_type = "detail";
    urlParams = urlParams + "/-1";
  } else if ("增加跳转" == operate_type) {
    page_type = "simple-add";
  } else if ("更新跳转" == operate_type) {
    urlParams = urlParams + "/-1";
    page_type = "simple-update";
  } else if ("编辑列表跳转" == operate_type) {
    page_type = "editgrid";
  }

  var application = item["application"];
  urlParams =
    urlParams +
    "?operate_params=" +
    operate_params_str +
    "&time=" +
    new Date().getTime();
  if (application) {
    urlParams = urlParams + "&srvApp=" + application;
  }
  custAddTab(page_type, urlParams, item.service_view_name, item);
}

/**
 * 前置数据处理
 */
export function pre_data_handle(butinfo, operateData, params = {}) {
  var me = params?.vm||{};
  var pre_data_handle = butinfo.pre_data_handle;
  if (
    pre_data_handle != undefined &&
    pre_data_handle != null &&
    pre_data_handle != ""
  ) {
    if (operateData) {
      if (operateData.length == 0) {
        operateData = [{}];
      }
    }

    eval("var zz=" + pre_data_handle + "(operateData,me); zz");
  }
  return operateData;
}

/**
 * 后置动作
 * @param {*} butinfo
 */
export function suffix_actions(butinfo) {
  var page_type = butinfo.page_type;
  var suffix_actions = butinfo.suffix_actions;

  if (page_type && page_type.endsWith("列表")) {
    this.loadTableData();
  } else {
    if (suffix_actions == "refresh") {
      window.location.reload();
    }
  }
}


/**
 * 组装参数数据
 * @param {*} butinfo
 * @param {*} operateData
 */
export function getchildPackageData(childRequests, operateData, params = {}) {
  var bxRequests = [];
  if (
    childRequests != null &&
    childRequests != "" &&
    childRequests != undefined
  ) {
    for (var requestTtem of childRequests) {
      var request = {};
      request.serviceName = requestTtem.serviceName;
      if (requestTtem["data"] != undefined) {
        request.data = requestTtem["data"];
      }

      if (requestTtem["condition"] != undefined) {
        request.condition = requestTtem["condition"];
      }

      var depend_keys = requestTtem["depend_keys"];
      if (
        depend_keys != undefined &&
        depend_keys != "" &&
        depend_keys != null
      ) {
        request["depend_keys"] = depend_keys;
      }
      var depend_condition_keys = requestTtem["depend_condition_keys"];

      if (
        depend_condition_keys != undefined &&
        depend_condition_keys != "" &&
        depend_condition_keys != null
      ) {
        request["depend_condition_keys"] = depend_condition_keys;
      }
      bxRequests.push(request);
    }
  }

  return bxRequests;
}



/**
 * 组装参数数据
 * @param {*} butinfo
 * @param {*} operateData
 */
export function getPackageData(butinfo, operateData, params = {}) {
  var packagedata = {};
  var new_data = {};
  var new_conditions = [];
  //按钮操作参数
  var operate_params = JSON.parse(butinfo["operate_params"]);

  if (operate_params != "" && operate_params != null) {
    var data = operate_params["data"];
    /**
     * 增加是否合并配置，"is_merge" = true 参数数据与 operateData 合并，operate_params.data 优先
     */
    var isMerge = false;
    if (operate_params.hasOwnProperty("is_merge")) {
      isMerge = operate_params["is_merge"];
    }

    if (data != undefined && data != null && data != null) {
      new_data = {};
      for (var data_item of data) {
        for (var col_key in data_item) {
          if (col_key == "child_data_list") {
            var childParams = data_item["child_data_list"];
            var childRequests = this.getchildPackageData(
              childParams,
              operateData,
              params
            );
            if (childRequests.length > 0) {
              new_data["child_data_list"] = childRequests;
            }
          } else {
            var col_cfg = data_item[col_key];
            if (isMerge) {
              new_data = operateData[0];
            }
            if (col_cfg["value_type"] == "constant") {
              new_data[col_key] = col_cfg["value"];
            } else if (col_cfg["value_type"] == "sysvar") {
              if (col_cfg["value"] == "nowdate") {
                new_data[col_key] = dayjs(new Date()).format("YYYY-MM-DD");
              } else {
                new_data[col_key] = eval("top." + col_cfg["value"]);
              }
            } else if (col_cfg["value_type"] == "rowData") {
              if (operateData.length > 0) {
                new_data[col_key] = operateData[0][col_cfg["value_key"]];
              } else {
                new_data[col_key] = null;
              }
            } else if (col_cfg["value_type"] == "mainData") {
              // 主表数据
              if (
                params?.listMainFormDatas &&
                typeof params?.listMainFormDatas === "object" &&
                Object.keys(params?.listMainFormDatas).length > 0
              ) {
                new_data[col_key] =
                  params?.listMainFormDatas[col_cfg["value_key"]] || null;
              }
            }
          }
        }
      }
    }

    var condition = operate_params["condition"];
    if (condition != undefined && condition != null && condition != null) {
      for (var condition_item of condition) {
        var newCondition = {};
        newCondition["colName"] = condition_item["colName"];
        newCondition["ruleType"] = condition_item["ruleType"];
        var valueCfg = condition_item["value"];

        var value_type = valueCfg["value_type"];
        if (value_type == "constant") {
          newCondition["value"] = valueCfg["value"];
        } else if (value_type == "sysvar") {
          if (valueCfg["value"] == "nowdate") {
            newCondition["value"] = this.formatDateTime(new Date());
          } else {
            newCondition["value"] = eval("top." + valueCfg["value"]);
          }
        } else if (value_type == "rowData") {
          var value_key = valueCfg["value_key"];
          var value_str = "";
          for (var rowMap of operateData) {
            value_str = value_str + "," + rowMap[value_key];
          }
          value_str = value_str.substring(1);
          newCondition["value"] = value_str;
        }
        new_conditions.push(newCondition);
      }
    } else {
      if (butinfo.servcie_type === "update") {
        if (
          operateData.length === 1 &&
          operateData[0].hasOwnProperty("id")
        ) {
          let condition = {
            colName: "id",
            ruleType: "eq",
            value: operateData[0].id,
          };
          new_conditions.push(condition);
        }
      }
    }
  }

  packagedata.data = new_data;
  packagedata.conditions = new_conditions;
  return packagedata;
}
