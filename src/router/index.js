import Vue from "vue";
import VueRouter from "vue-router";
import HomeView from "@/views/page-editor/page-editor.vue";

Vue.use(VueRouter);

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
      path: "/preview",
      name: "preview",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("@/views/preview.vue"),
    },
    {
      path: "/player",
      name: "player",
      component: () => import("@/views/video-player.vue"),
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
});

export default router;
