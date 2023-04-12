import axios from "axios";

sessionStorage.setItem(
  "bx_auth_ticket",
  "xabxdzkj-0aa6865c-9c07-4b80-a25b-73984e52684c"
);
const baseURL = window.backendIpAddr || `https://wx.100xsys.cn`;

export const $axios = axios.create({
  baseURL,
  timeout: 3000,
  withCredentials: true,
  // headers: {'X-Custom-Header': 'foobar'}
});
$axios.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    // request.headers.set('bx_auth_ticket', sessionStorage.getItem("bx_auth_ticket"))
    let bx_auth_ticket = sessionStorage.getItem("bx_auth_ticket");
    config.headers.set("bx_auth_ticket", bx_auth_ticket);
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);
$axios.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么

    let filter = (response) => {
      // this.msgTips()
      let _this = window.app;
      if (response.hasOwnProperty("status") && response.status === 429) {
        //layer.msg('当前使用人数过多，请稍后再试', {icon: 12});
        // this.msgTips()
        // Vue.prototype.msgTips();
      }

      // console.log("response",response)
      if (response.data.state == "FAILURE") {
        if (response.data.resultCode == "0011") {
          // if (_this.getRootWindow().layer) {
          //   var login_page = "/main/login.html";
          //   try {
          //     if (top.getLoginAddress) {
          //       console.info("1");
          //       login_page = "/" + top.getLoginAddress();
          //     }
          //   } catch (exception) {}
          //   _this.getRootWindow().layer.open({
          //     title: false,
          //     type: 2,
          //     content: window.location.origin + login_page,
          //     closeBtn: 0,
          //     area: ["300px", "350px"],
          //     shade: 0.9,
          //   });
          // } else {
          //   // 当vue页面在iframe中时，跳转到登录页面
          //   if (top !== window) {
          //     var login_page = "/main/index.html";
          //     try {
          //       if (top.getMainAddress) {
          //         console.info("1");
          //         login_page = "/" + top.getMainAddress();
          //       }
          //     } catch (exception) {}
          //     window.location.href = window.location.origin + login_page;
          //   }
          // }
        } else if (response.data.resultCode == "0000") {
          if (sessionStorage.getItem("need_login_flag") != "need_login") {
            // alert(response.data.resultMessage);
          }
        } else {
          if (response.data.resultCode !== "9998") {
            if (sessionStorage.getItem("need_login_flag") != "need_login") {
              // alert(response.data.resultMessage);
            }
          }
        }
      }
    };

    filter(response);

    return response;
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

export const $select = async (req, app) => {
  app = app || req.srvApp || req.mapp;
  if (app) {
    const url = `/${app}/select/${req.serviceName}`;
    const res = await $axios.post(url, req);
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
