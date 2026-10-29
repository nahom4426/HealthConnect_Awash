import { defineConfig, devices } from "@playwright/test";

// End-to-end walkthroughs for Marine & Cargo (plan section 10, FE-50). They run against the dev
// server with the in-browser mock backend, so no other service is needed.
// Run: npx playwright test   (Firefox and WebKit projects can be added once their browsers are installed)
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  // Generous: the dev server compiles each page on its first visit
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5197",
    viewport: { width: 1366, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } }],
  webServer: {
    command: "npx vite --port 5197 --strictPort",
    url: "http://localhost:5197",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
