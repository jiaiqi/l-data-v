import { Message } from "element-ui";
// import http from "./http";
import { $axios as http } from "../common/http";
import { useMetaStore } from "../stores/colMeta.js";
import { cloneDeep } from "lodash-es";
// const metaStore = useMetaStore();
const colMetaStore = {};
const setItem = (key, data) => {
  colMetaStore[key] = data;
  // localStorage.setItem("colMetaStore", JSON.stringify(colMetaStore));
};
const getItem = (key) => {
  // let colMetaStore = localStorage.getItem("colMetaStore");
  if (colMetaStore) {
    // colMetaStore = JSON.parse(colMetaStore);
    return colMetaStore[key];
  }
  return;
};
/**
 * 请求v2数据
 * @param {String} serviceName - 服务名称
 * @param {String} use_type - 方法名称
 * @param {*} app - 应用
 * @param {Boolean} isTree - 是否树型列表  true/false
 * @param {Boolean} forceFeth - 是否强制刷新，否的话会从缓存中读取
 */
const getServiceV2 = async (
  serviceName,
  use_type = "list",
  app = "health",
  pageNo = null,
  forceFeth = false
) => {
  if (serviceName) {
    // const v2FromStore = metaStore.metaMap[`${service}-${use_type}`];
    if (getItem(`${serviceName}-${use_type}`)) {
      return getItem(`${serviceName}-${use_type}`);
    }
    const req = {
      serviceName: "srvsys_service_columnex_v2_select",
      colNames: ["*"],
      condition: [
        { colName: "service_name", value: serviceName, ruleType: "eq" },
        { colName: "use_type", value: use_type, ruleType: "eq" },
      ],
      order: [{ colName: "seq", orderType: "asc" }],
    };
    let url = `${app}/select/srvsys_service_columnex_v2_select`;
    const res = await http.post(url, req);
    if (res?.data?.state === "SUCCESS") {
      setItem(`${serviceName}-${use_type}`, cloneDeep(res.data));
      return res.data;
    }
  }
};

const onSelect = async (serviceName, app, condition, params = {}) => {
  if (serviceName) {
    const req = {
      serviceName: serviceName,
      colNames: ["*"],
      // condition: condition|| [],
      condition: condition ? cloneDeep(condition) : [],
      page: {
        rownumber: params?.rownumber || 100,
        pageNo: params?.pageNo || 1,
      },
    };
    if (params?.vpage_no) {
      req.vpage_no = params.vpage_no;
    }
    if (params?.order) {
      req.order = params.order;
    }
    if (params.isTree) {
      // rdt: Return Data Type  ttd: top tree data
      if (req.condition?.length || params.forceUseTTD) {
        req["rdt"] = "ttd";
      } else if (params.pidCol) {
        req.condition.push({
          colName: params.pidCol,
          ruleType: "isnull",
        });
      }
    }
    const url = `${app}/select/${serviceName}`;
    const res = await http.post(url, req);
    if (res?.data?.state === "SUCCESS") {
      return res.data;
    }
  }
};
export const onDelete = async (ids, service, app) => {
  const req = [
    {
      serviceName: service,
      condition: [{ colName: "id", ruleType: "in", value: ids }],
    },
  ];
  const url = `/${app}/operate/${service}`;
  if (ids) {
    const res = await http.post(url, req);
    if (res?.data?.state === "SUCCESS") {
      return res.data;
    } else {
      Message({
        showClose: true,
        message: res?.data?.resultMessage,
        type: "error",
      });
    }
  } else {
    Message({
      showClose: true,
      message: "请选择要删除的数据！",
      type: "error",
    });
  }
};
export const onBatchOperate = async (reqData, service = "", app = "") => {
  if (service && app) {
    if (Array.isArray(reqData) && reqData.length > 0) {
      // const url = `/${app}/operate/${service}`;
      const url = `/${app}/operate/multi`;
      const res = await http.post(url, reqData);
      return res.data;
    }
  }
};

const onBatchAdd = async (data = {}, serviceName = "", app = "daq") => {
  let operate = serviceName.slice(serviceName.lastIndexOf("_") + 1);
  let { add, del, update } = data;
  let reqArr = [];
  if (Array.isArray(add) && add.length > 0) {
    add.forEach((item) => {
      let obj = {
        data: [item],
        serviceName: serviceName.replace(operate, "add"),
      };
      reqArr.push(obj);
    });
  }
  if (Array.isArray(update) && update.length > 0) {
    update.forEach((item) => {
      let obj = {
        data: [item],
        condition: [
          {
            colName: "id",
            ruleType: "eq",
            value: item.id,
          },
        ],
        serviceName: serviceName.replace(operate, "update"),
      };
      reqArr.push(obj);
    });
  }
  if (Array.isArray(del) && del.length > 0) {
    del.forEach((id) => {
      let obj = {
        condition: [
          {
            colName: "id",
            ruleType: "eq",
            value: id,
          },
        ],
        serviceName: serviceName.replace(operate, "delete"),
      };
      reqArr.push(obj);
    });
  }
  if (update.length > 0 && del.length == 0 && add.length === 0) {
    serviceName = serviceName.replace(operate, "update");
  }
  if (add.length > 0 && del.length == 0 && update.length === 0) {
    serviceName = serviceName.replace(operate, "add");
  }
  if (del.length > 0 && add.length == 0 && update.length === 0) {
    serviceName = serviceName.replace(operate, "delete");
  }
  console.log(reqArr);
  if (reqArr.length > 0) {
    let url = `${app}/operate/${serviceName}`;
    return await http.post(url, reqArr);
  } else {
    alert("没有可以提交的数据", "没有可以提交的数据", {
      confirmButtonText: "确定",
      callback: (action) => {
        console.log(action);
      },
    });
  }
};

// 获取fk字段的下拉值
const getFkOptions = async (col = {}, row = {}, app, pageNo, rownumber) => {
  let { option_list_v2 } = col;
  app = option_list_v2?.srv_app || app || sessionStorage.getItem("current_app");

  let req = {
    serviceName: option_list_v2.serviceName,
    colNames: ["*"],
    condition: [],
    page: {
      pageNo: pageNo || 1,
      rownumber: rownumber || 20,
    },
  };
  if (option_list_v2?.relation_condition) {
    req.relation_condition = option_list_v2?.relation_condition;
  }
  let conditions = option_list_v2?.condition || option_list_v2?.conditions;

  if (conditions?.length) {
    conditions = JSON.parse(JSON.stringify(conditions));
    conditions = conditions.map((item) => {
      if (typeof item.value === "string" && item.value) {
        if (item.value.indexOf("data.") !== -1) {
          let colName = item.value.slice(item.value.indexOf("data.") + 5);
          if (row[colName]) {
            item.value = row[colName];
          } else {
            item.value = undefined;
          }
        } else if (item.value.indexOf("top.user") !== -1) {
          let key = item.value.split("top.user.");
          key = key.length > 1 ? key[1] : "";
          if (key) {
            let userInfo = sessionStorage.getItem("current_login_user");
            if (userInfo) {
              userInfo = JSON.parse(userInfo);
            }
            item.value = userInfo?.[key];
          }
        } else if (item.value?.value_type) {
          if (item.value?.value_type === "constant") {
            item.value = item.value?.value;
          } else if (item.value?.value_key) {
            item.value = row[item.value?.value_key];
          }
        } else if (
          item.value.indexOf("'") === 0 &&
          item.value.lastIndexOf("'") === item.value.length - 1
        ) {
          item.value = item.value.replace(/\'/gi, "");
        }
      }
      if (item.value_exp) {
        delete item.value_exp;
      }
      return item;
    });
  }
  req.condition = conditions;
  if (option_list_v2.serviceName) {
    let url = `${app}/select/${option_list_v2.serviceName}`;
    let res = await http.post(url, req);
    if (res.data.state === "SUCCESS") {
      return {
        data: res.data.data,
        page: res.data.page,
      };
    }
  }
};

export { getServiceV2, onSelect, onBatchAdd, getFkOptions };
