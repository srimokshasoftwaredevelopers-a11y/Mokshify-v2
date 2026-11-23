import { defineConfig, devices } from "@playwright/test";

/* End-to-end tests run against a production build (`npm run build` first) on port 3200, with a
   throwaway PGlite database rebuilt by scripts/e2e-db.ts on every run. The installed Edge is the
   browser, so no Playwright browser download is needed. */
const PORT = 3200;
export const E2E_ENV = {
  DATABASE_URL: "pglite://./.data/e2e",
  OWNER_NAME: "Owner Demo",
  OWNER_EMAIL: "owner@example.com",
  OWNER_PASSWORD: "e2e-owner-passphrase",
  DEMO_STAFF_PASSWORD: "e2e-staff-passphrase",
  PUBLIC_FORM_ORIGINS: "https://mokshify.io,https://www.mokshify.io",
  APP_URL: `http://localhost:${PORT}`,
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,                       // one embedded database, one writer
  retries: 0,
  timeout: 45_000,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, channel: "msedge", trace: "retain-on-failure", ...devices["Desktop Edge"] },
  webServer: {
    command: `npx tsx scripts/e2e-db.ts && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: E2E_ENV,
  },
});
