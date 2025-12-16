import dayjs from "dayjs";
import * as DataUtil from "./DataUtil";
import {
  formatMoney,
  monthEnd,
  monthStart,
  traverseObj,
  weekEnd,
  weekStart,
  parseUrlParams,
} from "./DataUtil";
import Vue from "vue";
import isEmpty from "lodash/isEmpty";
import isArray from "lodash/isArray";
import isFunction from "lodash/isFunction";
import isString from "lodash/isString";
import isBoolean from "lodash/isBoolean";
import isUndefined from "lodash/isUndefined";
import { $axios as $http } from "@/common/http";

let baseURL = window.backendIpAddr;

function initBaseURL() {
  let pathConfig = sessionStorage.pathConfig;
  if (pathConfig) {
    try {
      pathConfig = JSON.parse(pathConfig);
      if (pathConfig?.gateway) {
        baseURL = pathConfig?.gateway;
      }
    } catch (error) { }
  }
  window.backendIpAddr = baseURL
}

function init_util() {
  initBaseURL()
  const eventBus = new Vue();
  const common_page_path = {
    detail: "/vpages/index.html#/detail",
    list: "/vpages/index.html#/list",
    "simple-add": "/vpages/index.html#/simple-add",
    "simple-update": "/vpages/index.html#/simple-update",
    "start-proc": "/vpages/index.html#/startproc",
    procdetail: "/vpages/index.html#/procdetail",
    procdetail_v2: "/vpages/index.html#/v2/procdetail",
    "start-proc_v2": "/vpages/index.html#/v2/startproc",
    editgrid: "/vpages/index.html#/editgrid",
    explain: "/vpages/index.html#/explain?",
    report: "/vpages/index.html#/reportList",
  };

  Vue.prototype.$http = $http;

  Vue.prototype.$select = async (req, app) => {
    app = app || req.srvApp || req.mapp;
    if (app) {
      const url = `/${app}/select/${req.serviceName}`;
      const res = await $http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        return {
          msg: res?.data?.resultMessage,
          ok: true,
          data: res.data?.data || [],
        };
      } else {
        return {
          msg: res?.data?.resultMessage,
          ok: false,
        };
      }
    }
  };

  Vue.prototype.download = function (filePath, name) {
    // let url = this.serviceApi().downloadFile + filePath
    window.location.href = filePath;
    // 利用原生fetch直接下载文件
    // return new Promise((resolve, reject) => {
    //   this.$http({
    //     method: 'post',
    //     url: url,
    //     responseType: 'blob'
    //   }).then(
    //     response => {
    //       if(response.data.state && response.data.state == "FAILURE"){
    //         console.log('download',response)
    //         this.$alert(response.data.resultMessage, '提示', {
    //           confirmButtonText: '确定'
    //         });
    //       }else{
    //           resolve(response.data)
    //           let blob = new Blob([response.data],{
    //             type:response.headers.map['content-type'][0] + ';charset=UTF-8'
    //           })
    //           console.log('download',blob,response,response.headers.map['content-type'][0])
    //           let fileName = name
    //           if (window.navigator.msSaveOrOpenBlob) {
    //             // console.log(2)
    //             navigator.msSaveBlob(blob, fileName)
    //           } else {
    //             // console.log(3)
    //             var link = document.createElement('a')
    //             link.href = window.URL.createObjectURL(blob)
    //             link.download = fileName
    //             link.click()
    //             //释放内存
    //             window.URL.revokeObjectURL(link.href)
    //           }
    //       }

    //     },
    //     err => {
    //       reject(err)
    //     }
    //   )
    // })
  };
  Vue.prototype.emitEvent = function (eventType, data) {
    let eventKey = eventType + "#" + this.getNodePath();
    eventBus.$emit(eventKey, data);
  };

  Vue.prototype.isJSON = function (str) {
    if (typeof str == "string") {
      JSON.parse(str);
      try {
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    }
    //console.log('It is not a string!')
  };
  Vue.prototype.onEvent = function (nodePath, eventType, callback) {
    let eventKey = eventType + "#" + nodePath;
    eventBus.$on(eventKey, callback);
  };
  /**
   *
   * @param {*} randomLength
   */
  Vue.prototype.GenNonDuplicateID = function (s, e) {
    //  let str = Number(Math.floor((Math.random()+Math.floor(Math.random()*9+1))*Math.pow(10,9)) + Date.now()).toString(12)
    let str =
      Math.floor(
        (Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, 9)
      ).toString(16) + Date.now().toString(16);
    //  console.log(Math.random().toString().substr(3,randomLength),Date.now(),str)
    if (s) {
      str = s + str;
    }
    if (e) {
      str = str + e;
    }
    return str;
  };
  //GenNonDuplicateID()将生成 rfmipbs8ag0kgkcogc 类似的ID
  /**
   * resolve default srvapp from vue component
   * @returns {*}
   */
  Vue.prototype.resolveDefaultSrvApp = function () {
    let app = null;
    // search $srvApp from node to root
    let node = this;
    while (!node.$srvApp) {
      if (node.$parent) {
        node = node.$parent;
      } else {
        break;
      }
    }

    if (node.$srvApp) {
      app = node.$srvApp;
    } else {
      // whole path does not have $srvApp,
      // try  page level
      const $route = node?.$route
      if ($route?.query?.srvApp) {
        app = $route.query.srvApp;
      } else {
        // try top level
        let defaultApp =
          (window.frameElement && window.frameElement.dataset["app"]) ||
          (top.window.pathConfig && top.window.pathConfig.application);
        app = defaultApp;
      }
    }

    return app;
  };

  /**
   *
   * @param operate_type: operate | select
   * @param service
   * @param app
   * @returns {string}
   */
  Vue.prototype.getServiceUrl = function (operate_type, service, app) {
    app = app || this.resolveDefaultSrvApp();
    return backendIpAddr + "/" + app + "/" + operate_type + "/" + service;
  };

  /**
   *
   * @param operate
   * @param service
   * @param app
   * @returns {string}
   */
  Vue.prototype.downloadexport = function (uuid) {
    var app = this.resolveDefaultSrvApp();
    var page_origin =
      window.location.protocol + "//" + window.location.hostname;
    var gateway_origin =
      window.top.pathConfig.gateway_protocol +
      "://" +
      window.top.pathConfig.gateway_ip;
    //跨域暂时没有想到好的解决方案
    if (page_origin == gateway_origin) {
      try {
        var url =
          backendIpAddr +
          "/" +
          app +
          "/downloadexport/" +
          uuid +
          "?bx_auth_ticket=" +
          sessionStorage.getItem("bx_auth_ticket");
        location.href = url;
        var loading = this.openLoading();

        const checkToken = function () {
          var token = getCookie("downloadToken");
          if (token && token == uuid) {
            clearTimeout(downloadTimer);
            loading.close();
          }
          setTimeout(() => {
            loading.close();
          }, 1000);
        };

        //获取cookie
        const getCookie = function (cookieName) {
          var strCookie = document.cookie;
          var arrCookie = strCookie.split(";");
          for (var i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (cookieName == arr[0].trim()) {
              return arr[1];
            }
          }
          return "";
        };

        var downloadTimer = setInterval(checkToken, 1000);
      } catch (e) {
        alert(e.name + ": " + e.message);
      }
    } else {
      var url =
        backendIpAddr +
        "/" +
        app +
        "/downloadexport/" +
        uuid +
        "?bx_auth_ticket=" +
        sessionStorage.getItem("bx_auth_ticket");
      window.location.href = url;
    }
  };

  //打开遮罩
  Vue.prototype.openLoading = function () {
    const loading = this.$loading({
      lock: true,
      text: "加载中",
      spinner: "el-icon-loading",
      background: "rgba(0, 0, 0, 0.7)",
    });
    return loading;
  };

  /**
   *
   * @param operate
   * @param service
   * @param app
   * @returns {string}
   */
  Vue.prototype.downloadFailimport = function () {
    var app = this.resolveDefaultSrvApp();
    var url = backendIpAddr + "/" + app + "/downloadImportFail";
    let bx_auth_ticket = sessionStorage.getItem("bx_auth_ticket");
    window.location.href = url + "?bx_auth_ticket=" + bx_auth_ticket;
  };

  Vue.prototype.getRootWindow = function (_window) {
    _window = _window || window;
    if (_window.top !== _window) {
      return this.getRootWindow(_window.top);
    } else {
      return _window;
    }
  };

  /**
   * 查询serviceCols, use an vuex cache here
   * @param service_name
   * @param use_type
   * @returns {*}
   */
  Vue.prototype.loadColsV2 = function (service_name, use_type, app) {
    let fullServiceName = this.resolveDefaultSrvApp() + "." + service_name;
    let cacheP =
      this.$store && this.$store.getters.getSrvCols(fullServiceName, use_type);
    if (cacheP) {
      return cacheP;
    }

    let loadedP = this.doLoadColsV2(service_name, use_type, app);
    this.$store &&
      this.$store.commit("addSrvCols", {
        service: fullServiceName,
        useType: use_type,
        response: loadedP,
      });
    // this.doLoadColsV2(service_name, use_type).then((res)=>{
    //   console.log("doLoadColsV2")
    // this.$store && this.$store.commit('addSrvCols', {
    //   service: fullServiceName,
    //   useType: use_type,
    //   response: loadedP,
    // })

    // })
    return loadedP;
  };

  function getV2RequestData(service_name, use_type) {
    let requestData = {
      serviceName: "srvsys_service_columnex_v2_select",
      colNames: ["*"],
      condition: [
        {
          colName: "service_name",
          value: service_name,
          ruleType: "eq",
        },
        {
          colName: "use_type",
          value: use_type,
          ruleType: "eq",
        },
      ],
      order: [
        {
          colName: "seq",
          orderType: "asc",
        },
      ],
    };
    let url = decodeURIComponent(window.location.href);
    let params = parseUrlParams(url);
    if (params && params.v2Params) {
      try {
        let v2Params = params.v2Params;
        v2Params = JSON.parse(decodeURIComponent(v2Params));
        if (v2Params && Array.isArray(v2Params.condition)) {
          requestData.condition = requestData.condition.concat(
            v2Params.condition
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
    return requestData;
  }

  Vue.prototype.doLoadColsV2 = function (service_name, use_type, app) {
    var data = getV2RequestData(service_name, use_type);

    var url = this.getServiceUrl(
      "select",
      "srvsys_service_columnex_v2_select",
      app
    );
    url = url + "?colsel_v2=" + service_name;
    return this.$http.post(url, data).then((response) => {
      //region mock data

      try {
        // if (service_name === 'srvsso_user_add') {
        //   response.data.data.validators = [{
        //     in_table_validate: "function(data, vm) {\n" +
        //       "            if (!data.email || !data.real_name) {\n" +
        //       "              return true\n" +
        //       "            }\n" +
        //       "            if (!data.email.startsWith(data.real_name) ) {\n" +
        //       "              return {\n" +
        //       "                \"message\": \"邮箱要以姓名开头\",\n" +
        //       "                \"cols\": [\"email\", \"real_name\"]\n" +
        //       "              };\n" +
        //       "            }else{\n" +
        //       "              return true\n" +
        //       "            }\n" +
        //       "          }"
        //   }]
        // }
      } catch (e) { }

      //endregion

      return response;
    });
  };

  Vue.prototype.loadHotTableData = function (metadata) {
    if (!this.$store) {
      return;
    }

    let table = metadata.table;
    let service = metadata.selectService;

    let cached = this.$store.getters.getTableData(table);
    if (cached) {
      return cached;
    }

    // commit a placeholder for now
    this.$store &&
      this.$store.commit("addTableData", {
        table,
        data: [],
      });

    var url = this.getServiceUrl("select", service, metadata.srvApp);
    var params = {
      serviceName: service,
      colNames: ["*"],
    };
    url = url + "?" + service;

    this.$http.post(url, params).then((response) => {
      let data = response.data.data;
      this.$store.commit("addTableData", {
        table,
        data,
      });
    });
  };

  /**查询生成导出excel*/
  Vue.prototype.genExportExcel = function (
    service_name,
    condition,
    page,
    order,
    group,
    mapcondition,
    isproc,
    columns
  ) {
    // var url = this.service_api.exportExcel;
    var url = this.getServiceUrl("export", service_name);
    return this.doSelect(
      url,
      service_name,
      condition,
      page,
      order,
      group,
      mapcondition,
      isproc,
      columns
    );
  };

  /**业务导出*/
  Vue.prototype.bizExport = function (service_name, condition, data) {
    // var url = this.service_api.exportExcel;
    var url = this.getServiceUrl("export", service_name);
    var params = {
      serviceName: service_name,
      colNames: ["*"],
      condition: condition || [],
      listData: data,
    };
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  /**查询列表*/
  Vue.prototype.select = function (
    service_name,
    condition,
    page,
    order,
    group,
    mapcondition,
    app,
    isproc,
    columns,
    relationCondition,
    draft,
    pageType
  ) {
    var url = this.getServiceUrl("select", service_name, app);
    return this.doSelect(
      url,
      service_name,
      condition,
      page,
      order,
      group,
      mapcondition,
      isproc,
      columns,
      relationCondition,
      draft,
      pageType
    );
  };

  /***
   * 根据文件data 获取文件类别
   */
  Vue.prototype.getFileType = function (e) {
    let types = {
      img: ["jpg", "JPG", "PNG", "JPEG", "jpeg", "png", "bmp", "tiff"],
      doc: ["xlsx", "xls", "xlsm", "docx", "doc", "wps", "ppt"],
      pdf: ["pdf"],
      media: ["mp3", "mp4", "avi", "mov", "mkv", "wav"],
    };
    let type = "more";
    for (let key in types) {
      if (e.hasOwnProperty("file_type")) {
        for (let item of types[key]) {
          if (e.file_type === item) {
            type = key;
          }
        }
      }
    }
    return type;
  };
  Vue.prototype.selectFileList = function (file_no) {
    let serviceName = "srvfile_attachment_select";
    var url = this.getServiceUrl("select", serviceName, "file");
    let condition = [
      {
        colName: "file_no",
        value: file_no,
        ruleType: "eq",
      },
      {
        colName: "is_delete",
        value: "1",
        ruleType: "eq",
      },
    ];

    return this.doSelect(url, serviceName, condition);
  };

  /**查询列表*/
  Vue.prototype.selectList = function (query, app) {
    let service_name = query.serviceName;
    let url = this.getServiceUrl("select", service_name, app);
    return this.$http.post(url, query);
  };

  /**查询*/
  Vue.prototype.doSelect = function (
    url,
    service_name,
    condition,
    page,
    order,
    group,
    mapcondition,
    isproc,
    columns,
    relationCondition,
    draft,
    pageType
  ) {
    var query = {
      serviceName: service_name,
      colNames: columns || ["*"],
      condition: condition || [],
      relation_condition: relationCondition || {},
      page: page,
      order: order,
      draft: draft,
    };
    if (pageType && pageType === "list_page") {
      query["query_source"] = "list_page";
    }
    if (isproc) {
      query["proc_data_type"] = isproc;
    }
    if (group) {
      query.group = group;
    }

    if (
      mapcondition != undefined &&
      mapcondition != "" &&
      mapcondition != null
    ) {
      query["map_table_condtion"] = mapcondition;
    }

    url = url + "?" + service_name;
    return this.$http.post(url, query);
  };

  /**查询*/
  Vue.prototype.selectByUser = function (
    service_name,
    condition,
    page,
    order,
    group,
    mapcondition,
    pageType
  ) {
    var url = this.getServiceUrl("select", service_name);
    var params = {
      serviceName: service_name,
      colNames: ["*"],
      condition: condition,
      group: group,
      page: page,
      order: order,
    };
    if (pageType && pageType === "list_page") {
      params["query_source"] = "list_page";
    }
    if (
      mapcondition != undefined &&
      mapcondition != "" &&
      mapcondition != null
    ) {
      params["map_table_condtion"] = mapcondition;
    }
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  /**查询*/
  Vue.prototype.selectproc = function (
    service_name,
    condition,
    page,
    order,
    proc_type,
    pageType
  ) {
    //var url = this.service_api.select;

    var url = this.getServiceUrl("select", service_name);
    var params = {
      serviceName: service_name,
      proc_data_type: proc_type,
      colNames: ["*"],
      condition: condition,
      page: page,
      order: order,
    };
    if (pageType && pageType === "list_page") {
      params["query_source"] = "list_page";
    }
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  /**查询*/
  Vue.prototype.treeSelect = function (service_name, condition) {
    var url = this.getServiceUrl("select", service_name);
    var params = {
      serviceName: service_name,
      treeData: true,
      colNames: ["*"],
      condition: condition,
    };
    url = url + "?" + service_name;
    return this.$http.post(url, params);
  };

  Vue.prototype.selectOne = function (
    service_name,
    condition,
    draft = false,
    isHisVer
  ) {
    var url = this.getServiceUrl("select", service_name);
    var params = {
      serviceName: service_name,
      colNames: ["*"],
      condition: condition,
      draft: draft === "true" ? true : false,
      hisVer: isHisVer || false,
    };
    url = url + "?" + service_name;
    return this.$http.post(url, params).then((response) => {
      if (response.data.data && response.data.data.length > 0) {
        response.body = response.data.data[0];
      }
      return response;
    });
  };

  /**操作*/
  Vue.prototype.operate = function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    let srvApp = requests[0].srvApp;
    var url = this.getServiceUrl("operate", service, srvApp);
    return this.$http.post(url, requests);
  };

  /**删除文件*/
  Vue.prototype.deleteFile = function (params) {
    var url = this.serviceApi().deleteFile;
    return this.$http.post(url, params);
  };

  /**
   * 返回常用的页面路径
   * @param type：页面类型
   * @returns {*}
   */
  Vue.prototype.getCommonPagePath = function (type) {
    return common_page_path[type];
  };

  /**操作*/
  Vue.prototype.addTab = function (type, urlParams, tab_title, srv, button) {
    if (tab_title == undefined || tab_title == null || tab_title == "") {
      tab_title = "新标页签";
    }
    let srvName = srv || null;
    var versionNo = this.getVersionNo();
    if (versionNo != "" && ("procdetail" == type || "start-proc" == type)) {
      type = type + "_" + versionNo;
    }
    let url = common_page_path[type] + urlParams;
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
  /**
   *  //字符串截取
   * @param {*} str
   * @param {*} n
   */
  Vue.prototype.getStrIntercept = function (str, n) {
    let strs = str;
    if (n) {
      if (str.length > n) {
        strs = str.substring(0, n) + "...";
        return strs;
      } else {
        return strs;
      }
    } else {
      return strs;
    }
  };
  /**
   *
   * @param {*} fileNo
   */
  Vue.prototype.getDownloadFile = function (file) {
    let self = this;
    if (
      !file.hasOwnProperty("_dl_auth") ||
      (file.hasOwnProperty("_dl_auth") && file["_dl_auth"])
    ) {
      let url = self.serviceApi().downloadFile + file.fileurl;
      window.location.href = url;
    } else {
      self.$alert("您无权限下载，请确认后重试！", "提示", {
        confirmButtonText: "确定",
      });
    }
  };

  Vue.prototype.addTabByUrl = function (url, tab_title, urlParams, type) {
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
  Vue.prototype.forwardAddTab = function (address, tab_title, button) {
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

    window.top.tab.addTab(page);
  };

  /**操作*/
  Vue.prototype.custAddTab = function (type, urlParams, tab_title, button) {
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
      // window.location.href = page.url
      // window.top.tab.replaceTab(page)
      window.top.tab.addTab(page);

      return;
    }

    window.top.tab.addTab(page);
  };

  Vue.prototype.approval = function (requests) {
    var url = this.serviceApi().approval;
    return this.$http.post(url, requests);
  };

  //直接启动流程
  Vue.prototype.startProc = function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    var url = this.getServiceUrl("apply", service);
    url = url + "?" + service;
    return this.$http.post(url, requests);
  };

  //保存草稿
  Vue.prototype.saveDraft = function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    var url = this.getServiceUrl("apply", service);
    url = url + "?" + service;
    for (var item of requests) {
      item.proc_save_type = "save";
    }
    return this.$http.post(url, requests);
  };

  //开启已有数据流程
  Vue.prototype.startDataProc = function (requests) {
    let service = requests.length > 0 ? requests[0].serviceName : "";
    var url = this.getServiceUrl("apply", service);
    url = url + "?" + service;
    for (var item of requests) {
      item.proc_data_type = "old";
    }
    return this.$http.post(url, requests);
  };

  // 唯一性校验
  (Vue.prototype.isUniqueCheck = async function (UniqueCheckConfig, model) {
    let url = this.getServiceUrl(
      "select",
      UniqueCheckConfig.serviceName,
      UniqueCheckConfig.srvApp
    );
    let cols = UniqueCheckConfig.columns;
    cols = cols.split(",");
    let reqs = {
      serviceName: UniqueCheckConfig.serviceName,
      colNames: cols,
      condition: [],
    };
    for (let i = 0; i < cols.length; i++) {
      let cond = {
        colName: cols[i],
        ruleType: "eq",
        value: model[cols[i]],
      };
      if (
        model[cols[i]] !== null &&
        model[cols[i]] !== "" &&
        model[cols[i]] !== undefined
      ) {
        reqs.condition.push(this.bxDeepClone(cond));
      }
    }
    return this.$http.post(url, reqs);

    //  let cols = this.$http.post(url, requests);
  }),
    (Vue.prototype.bxDeepClone = function (obj) {
      if (obj == null) return null;
      let newObj = obj instanceof Array ? [] : {};
      for (var i in obj) {
        newObj[i] =
          typeof obj[i] === "object" ? this.bxDeepClone(obj[i]) : obj[i];
      }
      return newObj;
    });

  Vue.prototype.parseDateTime = function (dateStr) {
    return dayjs(dateStr).toDate();
  };

  Vue.prototype.formatDateTime = function (date) {
    return dayjs(date).format("YYYY-MM-DD  HH:mm:ss");
  };

  Vue.prototype.parseDate = function (dateStr) {
    return dayjs(dateStr).toDate();
  };

  Vue.prototype.formatDate = function (date) {
    return dayjs(date).format("YYYY-MM-DD");
  };

  Vue.prototype.addDate = function (date, amount, flag) {
    return dayjs(date).add(amount, flag).toDate();
  };

  Vue.prototype.templateToString = function (row, temp) {
    let datas = row || {};
    let template = temp || "";
    let str = "return " + "`" + template + "`"; // 根据配置的模版字符串解析内容
    let func = new Function("row", str);
    let srv = func(datas);
    // console.log("templateToString",datas,temp,srv)
    return func(datas);
  };

  Vue.prototype.guid = function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  };

  Vue.prototype.formartMoney = function (s) {
    return formatMoney(s);
  };

  Vue.prototype.isEmptyCondition = function (condition) {
    let value = condition.value;
    if (condition.ruleType == "isnull" || condition.ruleType == "notnull") {
      return false;
    } else if (condition.ruleType == "between") {
      return (
        jQuery.isEmptyObject(value) || (value[0] == null && value[1] == null)
      );
    } else {
      if (typeof value == "object") {
        return jQuery.isEmptyObject(value);
      } else {
        return value == null || value == undefined || value === "";
      }
    }
  };

  Vue.prototype.money2zh = function (money) {
    return DataUtil.money2Zh(money);
  };

  Vue.prototype.isTopComp = function () {
    return this.$parent.$parent === this.$root;
  };

  Vue.prototype.isListTopComp = function () {
    if (this.$route && this.$route.meta.compName) {
      return (
        this.$parent.$parent.$parent === this.$root ||
        this.$options.name === this.$route.meta.compName
      );
    } else {
      return this.$parent.$parent.$parent === this.$root;
    }
  };

  Vue.prototype.getCurrPage = function () {
    let isInDialog = false;
    let node = this;

    while (node.$parent) {
      isInDialog =
        node.$parent.$vnode &&
        node.$parent.$vnode.tag &&
        node.$parent.$vnode.tag.endsWith("ElDialog");
      if (isInDialog) {
        break;
      } else {
        node = node.$parent;
      }
    }

    return isInDialog ? node : this.$root.$children[0].$children[0];
  };

  Vue.prototype.getOperateParams = function () {
    if (this.$route && this.$route.query && this.$route.query.operate_params) {
      return this.$route.query.operate_params;
    }
    return false;
  };

  Vue.prototype.getVueUrlParams = function (paraName) {
    if (this.$route && this.$route.query && this.$route.query[paraName]) {
      return this.$route.query[paraName];
    }
    return false;
  };

  Vue.prototype.getinitparams = function () {
    if (this.$route && this.$route.query && this.$route.query.init_params) {
      return this.$route.query.init_params;
    }
    return "";
  };

  Vue.prototype.eval = function (expr) {
    return eval(expr);
  };

  Vue.prototype.santinizeQueries = function (queries) {
    traverseObj(
      queries,
      (obj, key) => {
        if (key === "_rtDataCtx") {
          delete obj._rtDataCtx;
        } else if (key === "data") {
          if (!obj.data || isEmpty(obj.data)) {
            delete obj.data;
          }
        }
      },
      (obj, key) => {
        return key === "data" || key === "child_data_list" || isArray(obj);
      }
    );
  };

  Vue.prototype.weekStart = function () {
    return weekStart();
  };

  Vue.prototype.weekEnd = function () {
    return weekEnd();
  };

  Vue.prototype.monthStart = function () {
    return monthStart();
  };

  Vue.prototype.monthEnd = function () {
    return monthEnd();
  };

  Vue.prototype.toTemplateString = function (templ) {
    return "`" + templ + "`";
  };

  Vue.prototype.parseJson = function (str) {
    return Function('"use strict";return (' + str + ")")();
  };

  // noinspection JSUnusedLocalSymbols
  /**
   *
   * @param expr
   * @param data
   * @param vm
   * @returns {*}
   */
  Vue.prototype.evalBxExpr = function (expr, data, vm, defaultValue) {
    try {
      let user = top.user;
      return eval(expr);
    } catch (e) {
      return defaultValue || null;
    }
  };

  Vue.prototype.evalActionValidator = function (funcStr, data) {
    let vm = this;
    let expr = "var zz=(" + funcStr + ")(vm, data); zz";
    let test = this.evalBxExpr(expr, data, vm);
    if (test !== true) {
      this.$message.error(test + "");
      return false;
    } else {
      return true;
    }
  };

  Vue.prototype.getNodePath = function () {
    let node = this;
    while (!node.$srvApp) {
      if (node.$parent) {
        node = node.$parent;
      } else {
        break;
      }
    }
  };

  /**
   * (id | key| name | attrs[name])
   */
  Vue.prototype.getName = function () {
    let type = this.$options.name || this.$options._componentTag;
    let shortName =
      this.name ||
      (this.$attrs && this.$attrs.name) ||
      (this.$vnode && this.$vnode.key);
    return type + "#" + shortName;
  };

  Vue.prototype.getNodePath = function () {
    let tokens = [];

    // precondition: path already
    let node = this;
    while (node) {
      let isMarker =
        node.isMarker || (this.$attrs && this.$attrs["is-mark"] === "true");
      if (
        isMarker ||
        (node.getName && isFunction(node.getName) && node === this)
      ) {
        let name = node.getName();
        tokens.splice(0, 0, name);
      }

      node = node.$parent;
    }

    return tokens.join("/");
  };
  Vue.prototype.msgTips = function () {
    console.log("Vue.prototype.msgTips");
    window.top.limitingTips();
  };
  Vue.prototype.findNodeByPath = function (path) {
    // find leaf node type
    let tokens = path.split("/");
    let leafNodeType = tokens[tokens.length - 1].split("#")[0];

    // filter by their path
    return this.$root.findAnyNodeByTypeAndPredict(
      leafNodeType,
      (node) => node.getNodePath() === path
    );
  };
  /**
   * 新版可配置子表表单位置的 子表数据封装
   * @param {*} type
   * @param {*} predict
   */
  Vue.prototype.buildChildListConfig = function (e, mainData) {
    let self = this;
    let list = {
      form: {
        append: [],
        prepend: [],
      },
      field: {},
    };
    if (e && e.length > 0) {
      e.forEach(async (child, index) => {
        child["showPagination"] =
          window.sessionStorage.getItem("childPagination") || true;
        // Vue.set(child,'showPagination',true)
        let config = child.foreign_key.more_config;
        if (config && config.indexOf("field") !== -1) {
          config = JSON.parse(config);
          child["_childMoreConfig"] = config;
          if (config.hasOwnProperty("showPagination")) {
            child["showPagination"] = config.showPagination;
          }
          try {
            if (config.type) {
              if (
                config.type === "field" &&
                config.colName &&
                config.position
              ) {
                // 依附在字段的 子表
                if (list.field.hasOwnProperty(config.colName)) {
                  list.field[config.colName][config.position].push(child);
                } else {
                  let childObj = {
                    append: [],
                    prepend: [],
                  };
                  childObj[config.position].push(child);
                  list.field[config.colName] = childObj;
                }
              } else if (config.type === "form") {
                // 依附在表单的 子表
                if (config.position && config.positon === "prepend") {
                  list.form.prepend.push(child);
                } else {
                  list.form.append.push(child);
                }
              } else {
                // 没有moreconfig 配置默认
                list.form.append.push(child);
              }
            }
          } catch (error) { }
        } else {
          if (config) {
            config = JSON.parse(config);
            child["_childMoreConfig"] = config;
            if (config.hasOwnProperty("showPagination")) {
              child["showPagination"] = config.showPagination;
            }
          } else {
            child["_childMoreConfig"] = config;
          }

          list.form.append.push(child);
        }
      });
    }
    self.childrenListLoaded = true;
    // let childs = {childs:list,feildKeys:list.feild.keys()}
    return list;
  };
  /**
   * build 子表配置的
   * @param {*} type
   * @param {*} predict
   */
  Vue.prototype.buildCollapsed = function (childs, cols) {
    // 处理子表 Collapsed 组件的默认展开效果
    let childCollapsed = {
      form_append: [],
      form_prepend: [],
    };
    function collapseds(e, type) {
      let eds = [];
      for (let key = 0; key < e.length; key++) {
        let moreConfig = e[key]["_childMoreConfig"];
        if (moreConfig && moreConfig.collapse && moreConfig.collapse === true) {
          let num = type + key;
          eds.push(num);
        }
      }
      if (eds.length === 0) {
        let num = type + 0;
        eds.push(num);
      }
      return eds;
    }
    let keys = Object.keys(childs);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === "form") {
        childCollapsed["form_append"] = collapseds(
          childs[keys[i]]["append"],
          "form_append_"
        );
        childCollapsed["form_prepend"] = collapseds(
          childs[keys[i]]["prepend"],
          "form_prepend_"
        );
      } else if (keys[i] === "field") {
        let fieldChild = childs["field"];

        for (let c = 0; c < cols.length; c++) {
          let appends = fieldChild[cols[c]]["append"];
          let prepends = fieldChild[cols[c]]["prepend"];
          if (appends.length > 0) {
            childCollapsed[cols[c] + "_append"] = collapseds(
              appends,
              cols[c] + "_append_"
            );
          } else if (prepends.length > 0) {
            childCollapsed[cols[c] + "_prepend"] = collapseds(
              prepends,
              cols[c] + "_prepend_"
            );
          }
        }
      }
    }
    return childCollapsed;
  };
  /**
   * find descendant nodes with type and predict
   * @param type
   * @param predict
   * @returns {*}
   */
  Vue.prototype.findAnyNodeByTypeAndPredict = function (type, predict) {
    let nodeType = this.$options.name || this.$options._componentTag;
    if (nodeType && nodeType === type && (!predict || predict(this))) {
      return this;
    } else {
      for (let child of this.$children) {
        let match = child.findAnyNodeByTypeAndPredict(type, predict);
        if (match) {
          return match;
        }
      }
      return null;
    }
  };

  Vue.prototype.evalExprOrFunc = function (value, data, defaultValue) {
    try {
      if (isString(value)) {
        let vm = this;
        return eval(value);
      } else if (isFunction(value)) {
        return value(data);
      } else {
      }
    } catch (e) {
      if (isUndefined(defaultValue)) {
        throw e;
      } else {
        return defaultValue;
      }
    }
  };

  Vue.prototype.evalVersatileFlagVar = function (flagVar, data) {
    if (isBoolean(flagVar)) {
      return flagVar;
    } else if (isFunction(flagVar)) {
      return flagVar(data);
    } else {
      return !!flagVar;
    }
  };

  Vue.prototype.getVersionNo = function () {
    var version = "";
    var path = this.$route.path;
    var paths = this.$route.path.split("/");
    if (paths.length > 1) {
      var reg = /^v\d*$/;
      var value = paths[1];
      if (reg.test(value)) {
        version = value;
      }
    }
    return version;
  };

  Vue.prototype.removeByValue = function (datas, value) {
    var _index = -1;
    for (var i = 0; i < datas.length; i++) {
      if (datas[i] == value) {
        _index = i;
        break;
      }
    }

    if (_index > -1) {
      datas.splice(_index, 1);
    }
  };

  Vue.prototype.serviceApi = function (e) {
    let defaultApp = Vue.prototype.resolveDefaultSrvApp();
    var service_api = {
      selectOne: backendIpAddr + "/" + defaultApp + "/select",
      select: backendIpAddr + "/" + defaultApp + "/select",
      selectByUser: backendIpAddr + "/" + defaultApp + "/select",
      operate: backendIpAddr + "/" + defaultApp + "/operate",
      approval: backendIpAddr + "/" + defaultApp + "/process/approval",

      uploadFile: backendIpAddr + "/file/upload",
      downloadFilePrefix: backendIpAddr + "/file/download",
      downloadFile:
        backendIpAddr +
        "/file/download?" +
        "bx_auth_ticket=" +
        sessionStorage.getItem("bx_auth_ticket") +
        "&filePath=",
      deleteFile: backendIpAddr + "/file/delete",
      downloadFileNo:
        backendIpAddr +
        "/file/download?" +
        "bx_auth_ticket=" +
        sessionStorage.getItem("bx_auth_ticket") +
        "&fileNo=",
      exportExcel: backendIpAddr + "/" + defaultApp + "/export/exportExcel",
      importExcel: backendIpAddr + "/" + defaultApp + "/bizDataImport",

      qrcode: backendIpAddr + "/" + defaultApp + "/bxsys/qrcode",

      // startProc: backendIpAddr + defaultApp + "/bxsys/startProc",
      // saveDraft: backendIpAddr + defaultApp + "/bxsys/saveDraft",
      // startDataProc: backendIpAddr + defaultApp + "/bxsys/startDataProc",
    };
    if (e && e.indexOf("http") !== -1) {
      service_api.downloadFileNo = "";
      return service_api;
    }
    return service_api;
  };
  /**
   * 渲染html字符串时，将html字符串中的$bxFileAddress$换为真实地址
   * @param {*} val 
   * @returns 
   */
  Vue.prototype.recoverFileAddress = (val = "") => {
    // 替换文件前缀
    const prefix = backendIpAddr + "/file/download";
    val = val?.replaceAll?.("$bxFileAddress$", prefix) || "";
    // 使用正则表达式来匹配 bx_auth_ticket 的值，并使用sessionStorage.bx_auth_ticket替换它
    const ticketStr = `bx_auth_ticket=${sessionStorage.bx_auth_ticket}`;
    val = val.replace(/(bx_auth_ticket=)[^&]+/ig, ticketStr);
    return val;
  }
  /**
   * 保存html字符串时，将html字符串中的真实地址换为$bxFileAddress$
   * @param {*} val 
   * @returns 
   */
  Vue.prototype.replaceFileAddressSuffix = (val = "") => {
    const prefix = backendIpAddr + "/file/download";
    val = val?.replaceAll?.(prefix, "$bxFileAddress$");
    return val;
  }

  /**
   * 判断值是rgb还是hex 如果是hex 将其转换成rgb再返回 如果是rgb直接返回
   * @returns {string} 
   */
  Vue.prototype.getColor = (color) => {
    if (color.startsWith('#')) {
      const rgb = Vue.prototype.hexToRgb(color);
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    } else {
      return color;
    }
  }

  Vue.prototype.rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  /**
   * 将hex颜色代码转换为rgb颜色代码
   * @param {string} hex - hex颜色代码，如 "#FF0000" 或 "#F00"
   * @returns {object} - 包含rgb颜色的对象，如 { r: 255, g: 0, b: 0 }
   */
  Vue.prototype.hexToRgb = (hex) => {
    // 扩展简写的hex颜色代码（如 #333 -> #333333）
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

export default init_util;
