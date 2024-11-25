import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import vue2 from "@vitejs/plugin-vue2";
import UnoCSS from "unocss/vite";
import { VitePWA } from 'vite-plugin-pwa';
// import { createRequire } from 'node:module';
// import vueDevTools from 'vite-plugin-vue-devtools'
// const require = createRequire( import.meta.url );

// https://vitejs.dev/config/
export default defineConfig({
  base: "/dataview/",
  plugins: [
    vue2(),
    legacy({
      targets: ["ie >= 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
    UnoCSS(),
    // vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      workbox:{
        maximumFileSizeToCacheInBytes: 5000000,
      },
      manifest: {
        "name": "每日待办",
        "short_name": "每日待办",
        "description": '每日待办',
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
        "display": "standalone",
        "scope": "/",
        "start_url": "/#/sheet/srvoa_project_task_plan_select?srvApp=oa",
        "icons": [
          {
            "sizes": "192x192",
            "src": "/android-chrome-192x192.png",
            "type": "image/png"
          }, {
            "sizes": "512x512",
            "src": "/android-chrome-512x512.png",
            "type": "image/png",
            "purpose": "any maskable"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
