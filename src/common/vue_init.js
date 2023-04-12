import Vue from "vue";

function init() {

  let backendIpAddr = null;
  if (window.top.pathConfig && window.top.pathConfig.gateway) {
    // 如果外层有就用外层的路径配置
    let parentServerPath = window.top.pathConfig.gateway;
    if (parentServerPath.endsWith("/")) {
      backendIpAddr = parentServerPath.substring(
        0,
        parentServerPath.length - 1
      );
    } else {
      backendIpAddr = parentServerPath;
    }
  } else {
    // 单vue页面使用配置的后台地址
    let server_cfg = {
      // back_server_ip: "srvms.100xsys.cn",    // 240 139.129.128.155:5021   零售   http://192.168.0.155:8106
      // back_server_port: "8106",
      // 内网
      // back_server_protocol: "http",
      // back_server_ip: "192.168.0.241",
      // back_server_port: "8080",
      // 外网
      back_server_protocol: "https",
      back_server_ip: "wx.100xsys.cn", // 240 139.129.128.155:5021   零售   http://192.168.0.155:8106
      back_server_port: "",
      // back_server_ip: "192.168.0.192",  // 199
      // back_server_ip: "192.168.0.155",    // 240 139.129.128.155:5021
      // back_server_port: "8106",
      // back_server_ip: "139.196.209.46",    // 240 139.129.128.155:5021
      // back_server_port: "8106",
      // back_server_port: "8101",
      // back_server_ip: "192.168.0.192",    // 240 139.129.128.155:5021
      // back_server_port: "8101",
      // back_server_ip: "39.98.203.134",    // 240 139.129.128.155:5021
      // back_server_port: "8081",
      // back_server_ip: "192.168.0.244",    // 240 139.129.128.155:5021
      // back_server_port: "8101",
      // back_server_ip: "api.vanxum.com",    // http://api.vanxum.com:9080
      // back_server_port: "9080",
      // back_server_ip: "192.168.0.240",    // 240 139.129.128.155:5021   中铁
      // back_server_port: "8106",
      // back_server_ip: "192.168.0.121",    // 240 139.129.128.155:5021
      // back_server_port: "8101",
      // v2/procdetail/20200904153515052100
      // back_server_ip: "192.168.0.241",    // 240 139.129.128.155:5021   中铁
      // back_server_port: "8080",
      // back_server_ip: "192.168.0.241",    // 240 139.129.128.155:5021   中铁
      // back_server_port: "8080",
      // back_server_protocol: "https",
      // back_server_ip: "wx.100xsys.cn",
      // back_server_ip: "srvms.100xsys.cn",    // 100xsys
      // back_server_port: "443",
      // back_server_port: "",
    };
    backendIpAddr =
      server_cfg.back_server_protocol +
      "://" +
      server_cfg.back_server_ip +
      ":" +
      server_cfg.back_server_port;
  }
  window.backendIpAddr = backendIpAddr;

  let defaultApp =
    (window.frameElement && window.frameElement.dataset["app"]) ||
    (top.window.pathConfig && top.window.pathConfig.application);

  var service_api = {
    selectOne: backendIpAddr + "/" + defaultApp + "/select",
    select: backendIpAddr + "/" + defaultApp + "/select",
    selectByUser: backendIpAddr + "/" + defaultApp + "/select",
    operate: backendIpAddr + "/" + defaultApp + "/operate",
    approval: backendIpAddr + "/" + defaultApp + "/process/approval",
    uploadFile: backendIpAddr + "/file/upload",
    downloadFile: backendIpAddr + "/file/download?filePath=",
    deleteFile: backendIpAddr + "/file/delete",
    exportExcel: backendIpAddr + "/" + defaultApp + "/export/exportExcel",
    importExcel: backendIpAddr + "/" + defaultApp + "/bizDataImport",
    qrcode: backendIpAddr + "/" + defaultApp + "/bxsys/qrcode",
    downloadTemplate:
      backendIpAddr + "/" + defaultApp + "/downloadTemplate/excel/",
    imageFileNo: backendIpAddr + "/file/download?fileNo=",
  };

  window.serviceApi = service_api;

  Vue.prototype.service_api = service_api;

  Vue.config.productionTip = false;

  // // http conf, 请求跨域
  // Vue.http.options.xhr = {
  //   withCredentials: true,
  // };

  // Vue.http.interceptors.push((request, next) => {
  //   request.credentials = true;
  //   // console.log('request',request)
  //   request.headers.set(
  //     "bx_auth_ticket",
  //     sessionStorage.getItem("bx_auth_ticket")
  //   );

  //   return function (response) {
  //     // this.msgTips()

  //     if (response.hasOwnProperty("status") && response.status === 429) {
  //       //layer.msg('当前使用人数过多，请稍后再试', {icon: 12});
  //       // this.msgTips()
  //       Vue.prototype.msgTips();
  //     }
  //     // console.log("response",response)
  //     if (response.data.state == "FAILURE") {
  //       if (response.data.resultCode == "0011") {
  //         if (this.getRootWindow().layer) {
  //           var login_page = "/main/login.html";

  //           try {
  //             if (top.getLoginAddress) {
  //               console.info("1");
  //               login_page = "/" + top.getLoginAddress();
  //             }
  //           } catch (exception) {}

  //           this.getRootWindow().layer.open({
  //             title: false,
  //             type: 2,
  //             content: window.location.origin + login_page,
  //             closeBtn: 0,
  //             area: ["300px", "350px"],
  //             shade: 0.9,
  //           });
  //         } else {
  //           // 当vue页面在iframe中时，跳转到登录页面
  //           if (top !== window) {
  //             var login_page = "/main/index.html";
  //             try {
  //               if (top.getMainAddress) {
  //                 console.info("1");
  //                 login_page = "/" + top.getMainAddress();
  //               }
  //             } catch (exception) {}

  //             window.location.href = window.location.origin + login_page;
  //           }
  //         }
  //       } else if (response.data.resultCode == "0000") {
  //         if (sessionStorage.getItem("need_login_flag") != "need_login") {
  //           alert(response.data.resultMessage);
  //         }
  //       } else {
  //         if (
  //           response.data.resultCode !== "9998" &&
  //           response.data.resultCode !== "0111"
  //         ) {
  //           if (sessionStorage.getItem("need_login_flag") != "need_login") {
  //             alert(response.data.resultMessage);
  //           }
  //         }
  //       }
  //     }
  //   };

  //   next();
  // });
}

export default init;
