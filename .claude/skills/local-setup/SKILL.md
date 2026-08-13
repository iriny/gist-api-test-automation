---
name: local-setup
description: Set up this repo locally from a fresh clone and run the Playwright API test suite - installs dependencies, configures the GitHub token, runs smoke/regression tests, and opens the HTML report. Use when the user asks to set up, bootstrap, or get this project running locally, or to run the tests and generate/view a report.
allowed-tools: Bash(npm:*) Bash(npx:*) Bash(cp:*) Bash(open:*)
---

# Local setup: gist-api-test-automation

Playwright + TypeScript API test suite against GitHub's real Gist API (`api.github.com`,
no mocks). Full background: [README.md](../../../README.md).

## 1. Prerequisites

- Node.js installed (repo CI uses Node 22; any reasonably recent LTS works).
- Check with:

```bash
node -v
npm -v
```

## 2. Install dependencies

```bash
npm install
```

This installs `@playwright/test` and everything else in `package.json`. No separate
`npx playwright install` browser download is needed - this suite only makes HTTP API
calls, it never launches a browser.

## 3. Configure the GitHub token

Tests hit the real GitHub API, so they need a personal access token with `gist` scope.

```bash
cp .env.example .env
```

Then:

1. Go to https://github.com/settings/tokens -> **Tokens (classic)** -> **Generate new
   token (classic)** (fine-grained tokens don't yet cover the Gists API).
2. Check only the **gist** scope.
3. Copy the generated token into `.env` as `GITHUB_TOKEN=<token>`.

`.env` is gitignored - the token is never committed. Leave `BASE_URL` as the default
(`https://api.github.com`) unless testing against a GitHub Enterprise instance.

If `GITHUB_TOKEN` is missing or invalid, authenticated tests will fail with 401s -
re-check `.env` first if that happens.

## 4. Run the tests

```bash
npm test                  # full suite: smoke + regression
npm run test:smoke        # fast subset only, tagged @smoke
npm run test:regression   # edge cases / negative paths, tagged @regression
```

## 5. Generate and view the HTML report

The HTML reporter runs automatically on every `npm test` (see `playwright.config.ts`),
writing to `playwright-report/`. To open the last generated report in a browser:

```bash
npm run test:report
```

A JSON report is also written to `test-results/results.json` on every run, for tooling
that consumes structured results instead of the HTML view.

## 6. Optional: lint, format, typecheck

These run independently of the test suite (and independently of each other) - useful
before committing changes:

```bash
npm run lint           # eslint
npm run format:check   # prettier --check
npm run typecheck      # tsc --noEmit
```

Use `npm run format` to auto-fix formatting issues.

## Troubleshooting

- **401 / auth failures** - token missing, expired, or lacks the `gist` scope. Regenerate
  at https://github.com/settings/tokens and update `.env`.
- **422 on fork tests** - expected if GitHub rate-limits or the fixture gist changed;
  not a setup problem.
- **Rate limiting (403 with `X-RateLimit-Remaining: 0`)** - GitHub API rate limits are
  per-token; wait for the reset window shown in the response headers, or use a token with
  a higher limit.
