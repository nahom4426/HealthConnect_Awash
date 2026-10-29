import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "v_"]);
  // The dev proxy follows the same backend as the app, so .env.* is the only place to change it.
  const backendHost = env.VITE_BACKEND_HOST || "http://localhost:8888";
  // The Life Insurance service runs separately (Swagger: <host>/api/life/swagger-ui/index.html)
  const lifeHost = env.VITE_LIFE_API_HOST || backendHost;
  // Property & casualty (Fire, Burglary) can run as its own service; set VITE_PC_API_HOST for it
  const pcHost = env.VITE_PC_API_HOST || backendHost;

  return {
  plugins: [vue(), vueJsx() /*, vueDevTools()*/],
  envPrefix: ["VITE_", "v_"],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // More specific prefixes first: Vite matches proxy keys in order
      "/api/life": {
        target: lifeHost,
        changeOrigin: true,
        secure: lifeHost.startsWith("https"),
      },
      "/api/payer/property-casualty": {
        target: pcHost,
        changeOrigin: true,
        secure: pcHost.startsWith("https"),
      },
      "/api": {
        target: backendHost,
        changeOrigin: true,
        secure: backendHost.startsWith("https"),
      },
    },
    // Compile the shell and pages in the background after startup, so the first
    // visit to a page doesn't wait for Vite to transform it on demand.
    warmup: {
      clientFiles: [
        "./src/layouts/*.vue",
        "./src/components/**/*.vue",
        "./src/views/**/*.vue",
        "./src/features/**/*.vue",
      ],
    },
  },
  // Pre-bundle every library up front. Otherwise the first page that imports one makes
  // Vite re-optimize and force a full page reload mid-navigation.
  optimizeDeps: {
    include: [
      "@customizer/modal-x",
      "@headlessui/vue",
      "@iconify/vue",
      "@mdi/js",
      "@vueuse/components",
      "axios",
      "chart.js",
      "exceljs",
      "html2canvas",
      "jspdf",
      "jspdf-autotable",
      "jszip",
      "qrcode",
      "uuid",
      "vee-validate",
      "vue-i18n",
      "vue-toastification",
      "xlsx",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: they change rarely, so browsers keep them cached across deploys
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(vue|@vue|vue-router|pinia)\//.test(id)) return "vendor-vue";
          if (/node_modules\/(chart\.js|@kurkle)\//.test(id)) return "vendor-chart";
          if (/node_modules\/(axios|@customizer)\//.test(id)) return "vendor-core";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "source-map-js": "source-map",
    },
  },
  };
});
