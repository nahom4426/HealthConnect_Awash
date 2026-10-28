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

  return {
  plugins: [vue(), vueJsx() /*, vueDevTools()*/],
  envPrefix: ["VITE_", "v_"],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: backendHost,
        changeOrigin: true,
        secure: backendHost.startsWith("https"),
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
