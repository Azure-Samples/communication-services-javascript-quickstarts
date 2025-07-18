import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    // baseURL: "http://localhost:3000/",
    baseURL: "http://localhost:4280/",
    headless: false,
  },

  /* Configure projects for major browsers */
  projects: [
    // {
    //   name: "chromium",
    //   use: { ...devices["Desktop Chrome"] },
    // },

    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    /* Test against branded browsers. */
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "cd app && npm start",
      port: 3000,
      reuseExistingServer: false,
      timeout: 120 * 1000,
      // uncomment to see more logs
      // stdout: "pipe",
    },
    {
      command: "cd api && npm start",
      port: 7071,
      reuseExistingServer: false,
      timeout: 120 * 1000,
      // uncomment to see more logs
      // stdout: "pipe",
    },
    {
      command: "npx -p node@20.9 npm run start:dev",
      port: 4280,
      reuseExistingServer: false,
      timeout: 120 * 1000,
      // uncomment to see more logs
      // stdout: "pipe",
    },
  ],
});
