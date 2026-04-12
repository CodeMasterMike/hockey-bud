import { defineConfig } from '@playwright/test';

const baseURL = process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4200';
const isCI = !!process.env['CI'];
const isDeployed = !!process.env['PLAYWRIGHT_TEST_BASE_URL'];

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'list',

  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  // Auto-start ng serve for local runs; skip when testing a deployed URL
  webServer: isDeployed ? undefined : {
    command: 'npx ng serve --port 4200',
    port: 4200,
    reuseExistingServer: true,
    timeout: 120_000,
  },

  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 375, height: 812 } } },
  ],
});
