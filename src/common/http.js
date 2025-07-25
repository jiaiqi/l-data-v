import axios from "axios";
import { Message } from "element-ui"; // 引入elementUI的Message组件
let bx_auth_ticket = "";
export const webBaseUrl = `http://192.168.0.54:8080`
// export const webBaseUrl = `http://localhost:8080`
// let baseURL = window.backendIpAddr || `http://192.168.0.157:8104`;
// let baseURL = window.backendIpAddr || `https://xxld.100xsys.cn`;
// let baseURL = window.backendIpAddr || `http://192.168.0.151:180`;
let baseURL = window.backendIpAddr || `https://api.100xsys.cn`;
// let baseURL = window.backendIpAddr || `http://192.168.0.28:8104`;
// let baseURL = window.backendIpAddr || `http://113.201.21.178:880/bxapi`;// 延安现网
// let baseURL = window.backendIpAddr || `http://192.168.0.54:8104`;
// let baseURL = window.backendIpAddr || `http://192.168.0.241:8080`;
// let baseURL = window.backendIpAddr || `https://wx.100xsys.cn`;
const devTicket = 'xabxdzkj-9cd0ae64-88f0-4724-860c-866d823cd2bc'
// if (top?.pathConfig?.gateway) {
//   baseURL = top?.pathConfig?.gateway;
// }
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

const getRootWindow = (_window) => {
  _window = _window || window;
  if (_window.top !== _window) {
    return getRootWindow(_window.top);
  } else {
    return _window;
  }
};

console.log("env:", import.meta.env);

export const $axios = axios.create({
  baseURL,
  timeout: 20 * 1000,
  withCredentials: true,
  // headers: {'X-Custom-Header': 'foobar'}
});
$axios.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    bx_auth_ticket = sessionStorage.getItem("bx_auth_ticket");
    if (import.meta?.env?.DEV === true && !sessionStorage.logined) {
      bx_auth_ticket = devTicket
      sessionStorage.setItem('bx_auth_ticket', devTicket)
    }
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
      if (response.hasOwnProperty("status") && response.status === 429) {
        //layer.msg('当前使用人数过多，请稍后再试', {icon: 12});
        // this.msgTips()
        // Vue.prototype.msgTips();
      }

      // console.log("response",response)
      if (response.data.state == "FAILURE") {
        // Message({
        //   showClose: true,
        //   message: response?.data?.resultMessage || JSON.stringify(error),
        //   type: "error",
        // });
        if (response.data.resultCode == "0011") {
          let currentTenant = sessionStorage.currentTenant;
          sessionStorage.clear()
          localStorage.clear()
          if (currentTenant) {
            sessionStorage.currentTenant = currentTenant
          }
          if (getRootWindow()?.layer) {
            var login_page = "/main/login.html";
            try {
              if (top.getLoginAddress) {
                console.info("1");
                login_page = "/" + top.getLoginAddress();
              }
            } catch (exception) { }
            getRootWindow()?.layer.open({
              title: false,
              type: 2,
              content: window.location.origin + login_page,
              closeBtn: 0,
              area: ["300px", "350px"],
              shade: 0.9,
            });
          } else {
            // 当vue页面在iframe中时，跳转到登录页面
            if (top !== window) {
              var login_page = "/main/index.html";
              try {
                if (top.getMainAddress) {
                  console.info("1");
                  login_page = "/" + top.getMainAddress();
                }
              } catch (exception) { }
              window.location.href = window.location.origin + login_page;
            } else {

            }
          }
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
    console.error(error);
    if (error?.message?.indexOf("timeout") === 0) {
      Message({
        showClose: true,
        message: "网络请求超时,请稍候重试!",
        type: "error",
      });
    } else {
      Message({
        showClose: true,
        message: error?.data?.resultMessage || error?.message || JSON.stringify(error),
        type: "error",
      });
    }

    return Promise.reject(error);
  }
);

export const $http = $axios;

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

// 使用文件编号拼文件路径
export const getImagePath = (no, notThumb) => {
  if (no && typeof no === "string") {
    if (no.indexOf("http://") !== -1 || no.indexOf("https://") !== -1) {
      return no;
    }
    if (no.indexOf("data:image") !== -1 && no.indexOf("base64") !== -1) {
      return no;
    }
    if (no.indexOf("&bx_auth_ticket") !== -1) {
      no = no.split("&bx_auth_ticket")[0];
    }
    let url = `${serviceApi.imageFileNo}${no}&bx_auth_ticket=${bx_auth_ticket || sessionStorage.getItem("bx_auth_ticket")
      }`;
    return url;
  } else {
    return "";
  }
};

/**
 * 判断查询接口返回的数据是否有效
 * @param {object} res 接口返回的数据
 * @param {boolean} gtZero 查回来的数据长度是否需要大于0
 * @returns {boolean} true/false
 */
export const isValidResponse = (res, gtZero = false) => {
  if (res?.data?.state === "SUCCESS" && Array.isArray(res.data.data)) {
    if (!gtZero) {
      return true;
    } else if (gtZero && res.data.data.length === 0) {
      return false;
    }
  }
  return true;
};
