import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    // No-op outside GitHub Actions; in CI it turns failures into inline PR annotations
    // on the Checks tab / diff, so a failure is visible without opening the artifact.
    ['github'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://api.github.com',
    extraHTTPHeaders: {
      Accept: 'application/vnd.github+json',
    },
    trace: 'retain-on-failure',
  },
  // Every spec tags each test with @smoke or @regression. `smoke` is the fast subset
  // meant to run on every push; `smoke` + `regression` together (the default, unfiltered
  // run) is the full suite meant for PRs/scheduled runs. See README for the rationale.
  projects: [
    { name: 'smoke', grep: /@smoke/ },
    { name: 'regression', grep: /@regression/ },
  ],
});
