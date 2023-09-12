import Vue from "vue";
import { createPinia, PiniaVuePlugin } from "pinia";


import "@antv/x6-vue-shape";

import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";

import App from "./App.vue";
import router from "./router";
import './assets/iconfont/iconfont.css'
import "./assets/main.css";
import 'uno.css'

import { $axios,getImagePath } from "@/common/http.js";
Vue.prototype.$axios = $axios;

import VueUtil from '@/common/vue_util'
VueUtil()

import VueInit from "@/common/vue_init.js";
VueInit();

Vue.use(PiniaVuePlugin);

Vue.use(ElementUI);

// 引入VueEasytable
// 引入样式
import "vue-easytable/libs/theme-default/index.css";
// 引入组件库
import VueEasytable from "vue-easytable";
Vue.use(VueEasytable);
// 引入中文文语言包
import { VeLocale } from "vue-easytable";
import zhCN from "vue-easytable/libs/locale/lang/zh-CN.js";
VeLocale.use(zhCN);

Vue.prototype.getImagePath = getImagePath

new Vue({
  router,
  pinia: createPinia(),
  render: (h) => h(App),
}).$mount("#app");
