import Vue from "vue";
import VueRouter from "vue-router";
import HomeView from "@/views/page-editor/index.vue";
import { importRouters } from "./autoImportRouter";
Vue.use(VueRouter);

const routers = importRouters();
console.log(routers);
const router = new VueRouter({
  mode: "hash",
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "pageEditor",
      component: HomeView,
    },
    {
      path: "/dataview",
      name: "dataview",
      component: HomeView,
    },
    {
      path: "/player",
      name: "player",
      component: () => import("@/views/video-player.vue"),
    },
    {
      path: "/request",
      name: "requestBuilder",
      component: () => import("@/views/request-builder.vue"),
    },
    {
      path: "/request-preview",
      name: "requestpreview",
      component: () => import("@/views/request-preview.vue"),
    },
    {
      path: "/sheet/:service",
      name: "sheetEditor",
      component: () => import("@/views/sheetEditor.vue"),
    },
    {
      path: "/sheet/:service/:fkCol/:fkVal",
      name: "sheetEditor1",
      component: () => import("@/views/sheetEditor.vue"),
    },
    ,
    {
      path: "/h5",
      name: "h5Page",
      component: () => import("@/views/webview.vue"),
    },
    {
      path: "/test",
      name: "test",
      component: () => import("@/views/test.vue"),
    },
    ...routers,
  ],
  // routes: [
  //   {
  //     path: "/",
  //     name: "pageEditor",
  //     component: HomeView,
  //   },
  //   {
  //     path: "/dataview",
  //     name: "dataview",
  //     component: HomeView,
  //   },
  //   {
  //     path: "/preview",
  //     name: "preview",
  //     // route level code-splitting
  //     // this generates a separate chunk (About.[hash].js) for this route
  //     // which is lazy-loaded when the route is visited.
  //     component: () => import("@/views/preview.vue"),
  //   },
  //   {
  //     path: "/player",
  //     name: "player",
  //     component: () => import("@/views/video-player.vue"),
  //   },
  //   {
  //     path: "/request",
  //     name: "requestBuilder",
  //     component: () => import("@/views/request-builder.vue"),
  //   },
  //   {
  //     path: "/request-preview",
  //     name: "requestpreview",
  //     component: () => import("@/views/request-preview.vue"),
  //   },
  //   {
  //     path: "/sheet/:service",
  //     name: "sheetEditor",
  //     component: () => import("@/views/sheetEditor.vue"),
  //   },
  //   {
  //     path: "/sheet/:service/:fkCol/:fkVal",
  //     name: "sheetEditor1",
  //     component: () => import("@/views/sheetEditor.vue"),
  //   },
  //   ,
  //   {
  //     path: "/h5",
  //     name: "h5Page",
  //     component: () => import("@/views/webview.vue"),
  //   },
  // ],
});

export default router;
