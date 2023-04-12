import Vue from "vue";
import { createPinia, PiniaVuePlugin } from "pinia";

import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";

import App from "./App.vue";
import router from "./router";

// import "./assets/main.css";

import { $axios } from "@/common/http.js";
Vue.prototype.$axios = $axios;

import VueUtil from '@/common/vue_util'
VueUtil()

import VueInit from "@/common/vue_init.js";
VueInit();

Vue.use(PiniaVuePlugin);

Vue.use(ElementUI);

Vue.prototype.getImagePath = (no, notThumb) => {
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
    let url = `${
      serviceApi.imageFileNo
    }${no}&bx_auth_ticket=${sessionStorage.getItem("bx_auth_ticket")}`;
    return url;
  } else {
    return "";
  }
};

new Vue({
  router,
  pinia: createPinia(),
  render: (h) => h(App),
}).$mount("#app");
