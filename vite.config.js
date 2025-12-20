import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue2 from "@vitejs/plugin-vue2";
import UnoCSS from "unocss/vite";
// import defineOptions from 'unplugin-vue-define-options/vite';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/dataview/",
  plugins: [
    vue2(),
    UnoCSS(),
    // defineOptions(),
    // Gzip压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 大于10kb的文件进行压缩
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  build: {
    minify: 'terser',
    outDir: 'dataview',
    terserOptions: {
      compress: {
        // 生产环境删除console和debugger
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false, // 生产环境关闭sourcemap
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动配置代码分割
        manualChunks: {
          // Vue核心
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // UI组件库
          'element-ui': ['element-ui'],
          // ECharts图表库
          'echarts': ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/features', 'echarts/renderers'],
          // 工具库
          'utils': ['dayjs', 'axios'],
          // 表格组件
          'table': ['vue-easytable'],
        },
        // 对于入口文件
        entryFileNames: 'assets/js/[name]-[hash].js',
        // 对于代码分割生成的chunk文件
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // 对于资源文件
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'assets/img/[name]-[hash].[ext]';
          } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash].[ext]';
          } else if (/\.css$/i.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash].[ext]';
          }
          return 'assets/[ext]/[name]-[hash].[ext]';
        }
      }
    },
    // 分块策略
    chunkSizeWarningLimit: 1000, // 提高chunk大小警告限制
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
