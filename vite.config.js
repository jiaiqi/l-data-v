import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import vue2 from "@vitejs/plugin-vue2";
import UnoCSS from "unocss/vite";
// import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from 'vite-plugin-compression'
// import { VitePWA } from 'vite-plugin-pwa';
// import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/dataview/",
  plugins: [
    vue2(),
    legacy({
      targets: ['chrome 52', 'Android > 39', 'iOS >= 10.3', 'iOS >= 10.3'],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"], // 面向IE11时需要此插件
    }),
    UnoCSS(),
    // visualizer({ open: true }), // 自动开启分析页面
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: true,
    //   },
    //   workbox:{
    //     maximumFileSizeToCacheInBytes: 5000000,
    //   },
    //   manifest: {
    //     "name": "每日待办",
    //     "short_name": "每日待办",
    //     "description": '每日待办',
    //     "theme_color": "#ffffff",
    //     "background_color": "#ffffff",
    //     "display": "standalone",
    //     "scope": "/dataview/",
    //     "start_url": "/dataview/#/sheet/srvoa_project_task_plan_select?srvApp=oa",
    //     "icons": [
    //       {
    //         "sizes": "192x192",
    //         "src": "/dataview/android-chrome-192x192.png",
    //         "type": "image/png"
    //       }, {
    //         "sizes": "512x512",
    //         "src": "/dataview/android-chrome-512x512.png",
    //         "type": "image/png",
    //         "purpose": "any maskable"
    //       }
    //     ]
    //   }
    // })
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // 生产环境删除console和debugger
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false,
    // rollupOptions: {
    //   output: {
    //     manualChunks:{
    //       'echarts': ['echarts'],
    //       'vue': ['vue'],
    //       'vue-router': ['vue-router'],
    //       'element-ui': ['element-ui'],
    //     },
    //     chunkFileNames: 'js/[name]-[hash].js',  // 引入文件名的名称
    //     entryFileNames: 'js/[name]-[hash].js',  // 包的入口文件名称
    //     assetFileNames: '[ext]/[name]-[hash].[ext]' // 资源文件像 字体，图片等
    //   }
    // }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
