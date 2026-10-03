import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5180',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run e2e:server -w @suite/server',
      cwd: root,
      url: 'http://127.0.0.1:8787/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: '8787',
        COOKIE_SECURE: 'false',
        ORIGIN_ALLOWLIST: 'http://127.0.0.1:5180,http://localhost:5180',
        SESSION_SECRET: 'e2e-session-secret-32chars-min!!!',
        CHALLENGE_SECRET: 'e2e-challenge-secret-32chars-min!',
      },
    },
    {
      command: 'npm run dev -w @suite/online-client',
      cwd: root,
      url: 'http://127.0.0.1:5180',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
