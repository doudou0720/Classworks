// Plugins
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import Fonts from "unplugin-fonts/vite";
import Layouts from "vite-plugin-vue-layouts-next";
import Vue from "@vitejs/plugin-vue";
import VueRouter from "vue-router/vite";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";
//import { TDesignResolver } from 'unplugin-vue-components/resolvers'

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    VueRouter({
      dts: "src/typed-router.d.ts",
      routesFolder: "src/pages",
    }),
    vueDevTools(),
    Layouts(),
    Vue({
      template: { transformAssetUrls },
    }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        navigateFallback: "index.html",
        enabled: false,
        suppressWarnings: true,
      },

      lang: "zh-CN",
      injectRegister: "auto",
      strategies: "generateSW",

      workbox: {
        globPatterns: ["*"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => {
              return sameOrigin && url.pathname.endsWith("/assets/");
            },
            handler: "CacheFirst",
            options: {
              cacheName: "assets-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) => {
              return sameOrigin && url.pathname.startsWith("/pwa/");
            },
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "pwa-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 匹配当前域名下除了上述规则外的所有请求
            urlPattern: ({ url, sameOrigin }) => {
              if (!sameOrigin) return false;
              const path = url.pathname;
              // 排除已经由其他规则处理的路径
              return !(path.includes("/assets/") || path.includes("/pwa/"));
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "other-resources",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 天
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        additionalManifestEntries: [],
        clientsClaim: true,
        skipWaiting: true,
        importScripts: ["/sw-cache-manager.js"],
      },
      manifest: {
        name: "Classworks作业板",
        short_name: "Classworks",
        description: "记录，查看并同步作业",
        theme_color: "#212121",
        background_color: "#212121",
        display: "standalone",
        start_url: "./",
        edge_side_panel: {
          default_path: "./",
        },
        icons: [
          {
            src: "./pwa/image/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "./pwa/image/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "./pwa/image/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "./pwa/image/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "随机点名",
            short_name: "随机点名",
            url: "./#random-picker",
            icons: [
              {
                src: "./pwa/image/pwa-64x64.png",
                sizes: "64x64",
                type: "image/png",
              },
            ],
          },
        ],
      },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss",
      },
    }),
    Components({
      // 排除已在 index.vue 中通过 defineAsyncComponent 手动懒加载的组件
      // 避免 unplugin-vue-components 生成冲突的静态 import
      directoryAsNamespace: false,
      globs: ["src/components/**/[A-Z]*.vue"],
      exclude: [/pages\/index\.vue$/],
    }),
    Fonts({
      google: {
        families: [
          {
            name: "Roboto",
            styles: "wght@100;300;400;500;700;900",
          },
        ],
        display: "swap",
        fontBaseUrl: "https://fonts.googleapis.cn/css2",
        preconnectUrl: "https://fonts.gstatic.cn",
      },
    }),
    AutoImport({
      imports: ["vue", "vue-router"],
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  build: {
    // ===== Chunk 分割优化 =====
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/.test(id)) {
              return "vendor-vue";
            }
            if (/[\\/]node_modules[\\/]vuetify[\\/]/.test(id)) {
              return "vendor-vuetify";
            }
            if (/[\\/]node_modules[\\/]socket\.io-client[\\/]/.test(id)) {
              return "vendor-socket";
            }
            if (/[\\/]node_modules[\\/](axios|uuid|js-base64)[\\/]/.test(id)) {
              return "vendor-utils";
            }
          }
        },
      },
    },
  },
  server: {
    port: 3031,
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
    },
  },
});
