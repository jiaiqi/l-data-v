import Vue from "vue";
import VueRouter from "vue-router";
// import HomeView from "@/views/page-editor/index.vue";
import HomeView from "@/views/sheet-editor/index.vue";
// import { importRouters } from "./autoImportRouter";
Vue.use(VueRouter);

// const routers = importRouters();
// console.log(routers);
const router = new VueRouter({
  mode: "hash",
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "Home",
      component: HomeView
    },
    {
      path: "/:broadCastName/:childListType/:mainService/:app/:service",
      name: "childList",
      component: () => import("@/views/sheet-editor/index.vue"),
    },
    // {
    //   path: "/table-graph",
    //   name: "TableGraph",
    //   component: () => import('@/views/table-graph/index.vue')
    // },
    // {
    //   path: "/player",
    //   name: "player",
    //   component: () => import("@/views/video-player.vue"),
    // },
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
      component: () => import("@/views/sheet-editor/index.vue"),
    },
    {
      path: "/sheet/:app/:service",
      name: "sheetEditor1",
      component: () => import("@/views/sheet-editor/index.vue"),
    },
    {
      path: "/sheet/:app/:service/:fkCol/:fkVal",
      name: "sheetEditor2",
      component: () => import("@/views/sheet-editor/index.vue"),
    },
    {
      path: "/childList/:childListType/:broadCastName/:app/:service",
      name: "childList",
      component: () => import("@/views/sheet-editor/index.vue"),
    },
    {
      path: "/child-list/:broadCastName/:childListType/:mainService/:app/:service",
      name: "childList",
      component: () => import("@/views/sheet-editor/index.vue"),
    },
    {
      path: "/childList/:childListType/:service",
      name: "childList2",
      component: () => import("@/views/sheet-editor/index.vue"),
    },
    {
      path: "/h5",
      name: "h5Page",
      component: () => import("@/views/webview.vue"),
    },
    // ...routers,
  ],
});

export default router;
