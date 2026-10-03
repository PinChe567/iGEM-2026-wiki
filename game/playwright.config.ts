import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/wiki-client/e2e',
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4177',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npx --yes serve dist -l 4177',
    cwd: 'apps/wiki-client',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
