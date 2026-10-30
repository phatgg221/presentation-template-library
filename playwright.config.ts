import { defineConfig, devices } from "@playwright/test"

const PORT = 3101

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", locale: "vi-VN" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production build on a throwaway database so e2e runs never touch local data.
    command: `pnpm build && pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/templates`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: { DATABASE_PATH: "/tmp/ptl-e2e/app.db", STORAGE_DIR: "/tmp/ptl-e2e/storage", ADMIN_TOKEN: "e2e-admin-token" },
  },
})
