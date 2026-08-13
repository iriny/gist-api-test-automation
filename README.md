# Gist API Test Automation

REST API test automation for [GitHub's Gist API](https://docs.github.com/en/rest/gists), built
with TypeScript and [`@playwright/test`](https://playwright.dev/docs/api-testing). Tests run
against the real `api.github.com` - no mocks - so they verify the actual contract, not an
assumption about it.

## Why Playwright for API testing

`@playwright/test` gives a test runner, fixtures, parallelism, retries, and HTML/JSON
reporting out of the box via `request.newContext()` - no separate HTTP client, assertion
library, or runner needs wiring together. The same fixture model this repo uses for API
tests would extend cleanly to browser tests later (e.g. testing gist.github.com itself)
without switching frameworks.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `GITHUB_TOKEN` to a classic personal access token with the **gist**
scope (fine-grained tokens don't cover Gists yet):

1. https://github.com/settings/tokens -> Tokens (classic) -> Generate new token (classic)
2. Check only the `gist` scope
3. Copy the token into `.env` - it is never committed (`.env` is gitignored;
   `.env.example` documents the shape without a real value)

## Running tests

```bash
npm test              # full suite (smoke + regression)
npm run test:smoke    # fast subset only, tagged @smoke
npm run test:regression   # edge cases and negative paths, tagged @regression
npm run test:report   # open the last HTML report
```

`npm run lint`, `npm run format:check`, and `npm run typecheck` run independently of the
test suite and are meant to run in CI on every push regardless of whether tests run.

## How auth works

Every request needs a token with `gist` scope. Three fixtures in
[`src/fixtures/index.ts`](src/fixtures/index.ts) build three flavors of API client, each
wrapping its own `APIRequestContext`:

| Fixture                     | Auth header             | Used for                              |
| --------------------------- | ----------------------- | ------------------------------------- |
| `gistClient`                | `Bearer <GITHUB_TOKEN>` | Everything except negative auth tests |
| `unauthenticatedGistClient` | none                    | "no token" auth tests                 |
| `invalidTokenGistClient`    | `Bearer <garbage>`      | "bad token" auth tests                |

`gistClient` additionally tracks the id of every gist it creates (directly or via fork)
and deletes them all in fixture teardown - this runs whether the test passed, failed, or
threw, so tests never need their own `afterEach`/try-finally to stay clean. See
`TrackedGistApiClient` in `src/fixtures/index.ts`.

## Architecture

```
src/api/          GistApiClient - one method per Gist endpoint, plus typed request/
                   response interfaces (Gist, GistFile, GistComment, ...). Returns the raw
                   Playwright APIResponse; no assertions, no test.step() - a thin wrapper
                   around a single request.* call.
src/helpers/      Reusable named step blocks, one file per feature domain (gistHelper,
                   commentHelper, starHelper, forkHelper). Each function wraps one or more
                   GistApiClient calls inside test.step() with a human-readable name that
                   appears as its own node in the HTML report. The `*Response` form (e.g.
                   createGistResponse) returns the raw response with no assertion,
                   for tests where the status code under varying conditions is the point;
                   the plain form (e.g. createGist) asserts the happy-path status
                   and returns the parsed body, so setup code elsewhere doesn't repeat the
                   same check.
src/fixtures/     Playwright fixtures: authenticated/unauthenticated/invalid-token
                   clients, auto-cleanup, and buildGistPayload() - a test data builder
                   with sensible defaults you override per test.
src/data/         Named constants for edge-case payloads (unicode, empty content,
                   duplicate filenames, oversized content, malformed JSON) and stable
                   third-party fixtures (e.g. the octocat gist used for fork tests,
                   since GitHub rejects forking your own gist).
tests/api/gists/  One spec file per feature area, each independently runnable. Specs
                   call step helpers (and add their own one-off `test.step('Verify ...')`
                   blocks for assertions specific to that test) - no raw `request.*` or
                   bare `gistClient.*` calls with inline `expect()` in a spec body.
```

The split exists so that adding a new resource (say, GitHub Issues or Repos) means adding
a parallel `src/api/IssueApiClient.ts`, `src/helpers/issueHelper.ts`, and `tests/api/issues/`,
without touching anything under the `gists` equivalents. Nothing in `src/fixtures` or
`src/data` is Gist-specific by construction other than its filename - the same fixture
pattern (authenticated client + auto-cleanup + payload builder) applies to any resource.

## Adding a new test

1. Pick the right spec file by feature (`crud`, `visibility`, `stars`, `forks`,
   `comments`, `auth`, `validation`, `pagination`) - or add a new one under
   `tests/api/gists/` if it's a genuinely new feature area.
2. Import `test`, `expect`, and `buildGistPayload` from `src/fixtures`, not directly from
   `@playwright/test` - the custom `test` is what wires up `gistClient` and friends.
3. Reuse a step helper from `src/helpers/` before writing new spec logic - the action
   (create/get/update/delete/star/fork/comment) probably already exists as
   `createGist`, `createGistResponse`, etc. Only fall back to calling
   `gistClient` directly in a spec if no step helper fits and adding one isn't warranted.
4. Tag every test `@smoke` (golden path, must run on every push) or `@regression` (edge
   case / negative path, full suite only). Tags live in the title string, e.g.
   `test('creates a gist @smoke', ...)`.
5. If the API client doesn't have the method you need yet, add it to
   `src/api/GistApiClient.ts` - one line, returns `Promise<APIResponse>`, no assertions.
   Then add or extend a step helper in `src/helpers/` that wraps it in `test.step()`.
6. Any gist you create through `gistClient.createGist()` or `gistClient.forkGist()` is
   cleaned up automatically; nothing else to do.

## Adding a new resource (e.g. beyond Gists)

1. Add `src/api/<Resource>ApiClient.ts` following `GistApiClient`'s shape: one method per
   endpoint, typed payloads/responses in a sibling `types.ts`, no assertions inside.
2. Add fixtures for it in a new `src/fixtures/<resource>.ts` (or extend the existing file
   if it shares auth setup), following the tracked-client-plus-teardown pattern.
3. Add `src/helpers/<resource>Helper.ts` with one function per reusable action, each
   wrapping an API client call in `test.step()`, following `gistHelper.ts`'s pattern.
4. Add `tests/api/<resource>/` with one spec per feature area, built on the step helpers.
5. No changes needed to `playwright.config.ts` or the CI workflow - both already discover
   every spec under `tests/` and split by `@smoke`/`@regression` tag rather than by
   folder.

## CI

[`.github/workflows/api-tests.yml`](.github/workflows/api-tests.yml) runs two jobs:

- **`smoke`** - runs on every PR and push to `main`. Fast feedback loop.
- **`regression`** - the full suite (`npm test`, which covers `@smoke` + `@regression`
  together via Playwright's two logical projects). Runs on push to `main`, nightly via
  `schedule`, and on manual `workflow_dispatch`.

Both jobs upload the HTML report as a build artifact so a failure can be triaged without
re-running locally. The smoke job is matrix-ready (`strategy.matrix.node-version`) for
testing across multiple Node versions later without restructuring the workflow.

Add a repo secret named `GIST_TEST_TOKEN` (Settings -> Secrets and variables -> Actions)
holding a token with `gist` scope - the workflow maps it to the `GITHUB_TOKEN` env var the
tests read. It's named separately from the automatic `GITHUB_TOKEN` Actions provides,
which is scoped to the repo and cannot create gists.

## Design decisions worth knowing for a walkthrough

- **No mocking.** This exercises GitHub's real API contract, including behavior that
  isn't obvious from the docs alone - e.g. `GET /gists` doesn't actually require auth (it
  falls back to the public feed), and forking a gist you already own returns `422`. Both
  are asserted explicitly (`auth.spec.ts`, `forks.spec.ts`) so they read as documented
  behavior, not surprises.
- **Fork tests target a fixed third-party gist** (`octocat`'s "Hello world!",
  `src/data/wellKnownGists.ts`) instead of forking a gist the suite just created, because
  GitHub rejects self-forks.
- **Tests are independent and order-agnostic.** Nothing relies on execution order or
  shared state between tests; each test creates exactly what it needs and the
  `gistClient` fixture cleans it up.
- **Tags over folders for CI speed control.** `@smoke`/`@regression` in the title, not a
  separate directory, so a test's urgency is visible right next to its assertions and a
  test can be re-tagged without moving the file.
