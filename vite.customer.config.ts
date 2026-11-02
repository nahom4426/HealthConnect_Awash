import { fileURLToPath, URL } from "node:url";
import { renameSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, loadEnv, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

// The customer website: a separate entry (customer.html) with its own router, session and pages.
// It imports nothing from the staff app, so it builds and deploys on its own into dist-customer/.
//   npm run dev:customer     http://localhost:5174
//   npm run build:customer   dist-customer/ (serve with any static host; forward /api to the gateway)
function customerEntry(): Plugin {
  return {
    name: "customer-entry",
    configureServer(server) {
      // Every page path (not an asset or API call) serves the customer entry, so refreshes work
      server.middlewares.use((req, _res, next) => {
        const url = req.url || "/";
        const isPage = !/\.[a-z0-9]+(\?|$)/i.test(url.split("?")[0]) && !/^\/(@|api|src|node_modules)/.test(url);
        if (isPage) req.url = "/customer.html";
        next();
      });
    },
    closeBundle() {
      const out = resolve(process.cwd(), "dist-customer");
      if (existsSync(resolve(out, "customer.html"))) renameSync(resolve(out, "customer.html"), resolve(out, "index.html"));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "v_"]);
  const backendHost = env.VITE_CUSTOMER_API_HOST || env.VITE_BACKEND_HOST || "http://localhost:8888";
  return {
    plugins: [vue(), customerEntry()],
    envPrefix: ["VITE_"],
    server: {
      host: "0.0.0.0",
      port: 5174,
      proxy: {
        "/api": { target: backendHost, changeOrigin: true, secure: backendHost.startsWith("https") },
      },
    },
    build: {
      outDir: "dist-customer",
      emptyOutDir: true,
      rollupOptions: { input: resolve(process.cwd(), "customer.html") },
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  };
});
