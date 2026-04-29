import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Zigsaw E2E suite (issue #15).
 *
 * Run:
 *   bun run test:e2e          # headless against the dev server
 *   bun run test:e2e:ui       # Playwright UI mode for debugging
 *
 * CI runs the same config but with --reporter=github + retains traces on failure.
 */

const PORT = Number(process.env.E2E_PORT ?? 8081);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'bun run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
