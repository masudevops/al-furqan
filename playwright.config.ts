import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4320", trace: "retain-on-failure" },
  projects: [
    { name: "375-webkit", use: { ...devices["iPhone 13"], viewport: { width: 375, height: 812 } } },
    { name: "430-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 860 } } },
    { name: "768-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 900 } } },
    { name: "1280-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "1440-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: { command: "npm run dev -- -p 4320", url: "http://127.0.0.1:4320", reuseExistingServer: false, timeout: 120_000 },
});
