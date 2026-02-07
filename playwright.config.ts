import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000/taro_bot',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx next dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
