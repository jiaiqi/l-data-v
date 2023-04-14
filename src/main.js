import Vue from "vue";
import { createPinia, PiniaVuePlugin } from "pinia";

import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";

import App from "./App.vue";
import router from "./router";
import './assets/iconfont/iconfont.css'
import "./assets/main.css";

import { $axios,getImagePath } from "@/common/http.js";
Vue.prototype.$axios = $axios;

import VueUtil from '@/common/vue_util'
VueUtil()

import VueInit from "@/common/vue_init.js";
VueInit();

Vue.use(PiniaVuePlugin);

Vue.use(ElementUI);

Vue.prototype.getImagePath = getImagePath

new Vue({
  router,
  pinia: createPinia(),
  render: (h) => h(App),
}).$mount("#app");
