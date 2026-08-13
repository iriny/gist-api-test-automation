# Gist API Test Coverage

Scope: GitHub REST API, Gists resource (`/gists/*`). 40 automated tests across 8 spec files, split between two Playwright projects: `smoke` (`@smoke`, 15 tests) and `regression` (`@regression`, 25 tests).

## Priority model

Priority is assigned per endpoint/flow based on how central it is to the Gist resource's core purpose (create, read, share) versus secondary or edge behavior. This priority is what drove the smoke/regression split - it is not a separate ranking bolted on afterward.

**Priority 1: Core CRUD and auth**
Risk impact: If create/read/update/delete or authentication is broken, no other Gist feature can work and no test in the suite can even set up its preconditions. A regression here blocks the entire API surface.

**Priority 2: Secondary resource flows (stars, forks, comments) and data-integrity edges (validation, visibility)**
Risk impact: These are independently useful features built on top of a working gist. A regression here degrades a specific feature (sharing, collaboration, privacy) without taking down the whole API, but privacy (visibility) and data-integrity (validation) bugs carry outsized risk - a leaked secret gist or silently corrupted content undermines user trust in the resource itself.

**Priority 3: Listing/pagination behavior**
Risk impact: Pagination edge cases (clamping, out-of-range pages, zero/negative values) affect usability and API robustness against malformed clients, but a bug here doesn't lose data or expose anything - worst case is a confusing response shape.

## Smoke vs. regression criteria

A test is tagged `@smoke` when it meets at least one of:
- It exercises the primary happy path of a Priority 1 flow (create, read, update, delete, authenticate).
- It's the first representative case for a resource (star/unstar, fork, comment lifecycle) - proof the endpoint works at all.
- It's cheap, fast, and would block nearly everything else in the suite if it failed (e.g., "creating a gist with a valid token succeeds" is a precondition for most other tests).

Everything else - edge cases, negative paths, idempotency checks, cross-cutting concerns (pagination limits, empty states, ordering) - is `@regression`. These are still valuable but are not required to prove the API is minimally functional after a deploy.

## Coverage by flow

### 1. Authentication - `auth.spec.ts` (Priority 1)

| Test | Tag | Why |
|---|---|---|
| Creating a gist with a valid token succeeds | `@smoke` | Baseline proof that auth works; precondition for the rest of the suite |
| Creating a gist without a token returns 401 | `@smoke` | Core negative auth path - unauthenticated writes must be rejected |
| Creating a gist with an invalid token returns 401 | `@smoke` | Core negative auth path - garbage/expired tokens must be rejected, not silently accepted |
| Deleting a gist without a token returns 401 | `@regression` | Same auth rule applied to a second endpoint - confirms it's enforced consistently, not smoke-critical on its own |
| Starring a gist with an invalid token returns 401 | `@regression` | Auth enforcement on a secondary resource - important but not a blocker if 401 is already proven above |
| Listing gists without a token falls back to the public feed instead of 401 | `@regression` | Documents an intentional exception to the auth rule (public listing is anonymous-friendly) - edge behavior, not core path |

### 2. CRUD - `crud.spec.ts` (Priority 1)

| Test | Tag | Why |
|---|---|---|
| create -> read -> update -> delete a gist | `@smoke` | The single most important flow in the API - full lifecycle in one test |
| Creates a gist with multiple files and no description | `@regression` | Payload-shape variation, not a new behavior |
| Renames a file and removes another via update | `@regression` | Update edge case (file-level mutation within a gist) |
| Deleting a gist twice returns 404 on the second call | `@regression` | Idempotency/negative-path check |
| Getting a nonexistent gist id returns 404 | `@regression` | Standard negative-path check |

### 3. Validation - `validation.spec.ts` (Priority 2)

| Test | Tag | Why |
|---|---|---|
| An empty files object is rejected | `@smoke` | Fundamental input-validation guarantee - a gist cannot exist with zero files, worth confirming on every run |
| A malformed JSON request body returns 422 | `@smoke` | Baseline malformed-input handling - cheap, high-signal, guards the whole write path |
| Unicode and emoji in filename and content are preserved | `@smoke` | Data-integrity guarantee with real-world impact (non-ASCII content is common); silent corruption would be a serious, hard-to-notice bug |
| A file with empty string content is rejected | `@regression` | Narrower validation edge case building on the empty-files test |
| Duplicate filename keys in the raw request collapse to the last value | `@regression` | Documents JSON-object-key-collision behavior - subtle, low-frequency in real usage |
| Oversized (~1MB) file content is accepted or explicitly rejected, never silently corrupted | `@regression` | Boundary/size test - important but slow and not needed on every smoke run |

### 4. Visibility - `visibility.spec.ts` (Priority 2)

| Test | Tag | Why |
|---|---|---|
| A public gist is fetchable by id and marked public | `@smoke` | Core visibility contract - public gists must behave as public |
| A secret gist is fetchable by id but marked not public | `@smoke` | Core visibility contract - secret gists must behave as secret; privacy-adjacent, worth the smoke slot |
| A secret gist does not appear in the public gist listing | `@regression` | Extension of the same guarantee onto a second endpoint (listing vs. direct fetch) |
| Omitting the public flag defaults to a non-public gist | `@regression` | Default-value behavior - important for API consumers but not a distinct risk from the two smoke cases above |

### 5. Stars - `stars.spec.ts` (Priority 2)

| Test | Tag | Why |
|---|---|---|
| star -> check starred -> unstar -> check not starred | `@smoke` | Full lifecycle of the feature in one test - proves the endpoint set works |
| Starring an already-starred gist is idempotent | `@regression` | Idempotency edge case |
| Unstarring a gist that was never starred returns 204 | `@regression` | Idempotency edge case (GitHub's star API is deliberately idempotent on both sides) |
| Checking star status on a nonexistent gist returns 404 | `@regression` | Standard negative-path check |

### 6. Forks - `forks.spec.ts` (Priority 2)

| Test | Tag | Why |
|---|---|---|
| Forking a gist creates a new gist linked back to the original | `@smoke` | Core fork contract - the defining behavior of the feature |
| The original gist lists the fork under its forks array | `@regression` | Reverse-direction consistency check of the same relationship |
| Forking your own gist is rejected | `@regression` | Business-rule edge case |
| Forking a nonexistent gist returns 404 | `@regression` | Standard negative-path check |

### 7. Comments - `comments.spec.ts` (Priority 2)

| Test | Tag | Why |
|---|---|---|
| create -> list -> delete a comment | `@smoke` | Full lifecycle of the feature in one test |
| A new gist has no comments | `@regression` | Initial-state check |
| Multiple comments are listed in creation order | `@regression` | Ordering guarantee - matters for UX but not core CRUD |
| Deleting a comment on a nonexistent gist returns 404 | `@regression` | Standard negative-path check |
| An empty comment body is rejected | `@regression` | Validation edge case |

### 8. Pagination - `pagination.spec.ts` (Priority 3)

| Test | Tag | Why |
|---|---|---|
| per_page controls the number of returned gists | `@smoke` | The one behavior consumers actually rely on; everything else in this file is a boundary variant of it |
| per_page=0 falls back to the default page size instead of erroring | `@regression` | Boundary/default-value variant |
| A negative per_page falls back to the default page size instead of erroring | `@regression` | Boundary/default-value variant |
| per_page is clamped to a maximum of 100 | `@regression` | Boundary/clamping variant |
| page=0 and page=1 return the same first page | `@regression` | Boundary/default-value variant |
| A page number far beyond the available range returns 422, not an empty page | `@regression` | Boundary variant - documents GitHub's specific error behavior over the more common "empty array" assumption |

## Coverage gaps (not automated)

- Rate limiting / abuse-rate-limit headers (`X-RateLimit-*`) - would need a dedicated throttling-aware run, excluded to keep the suite fast and avoid tripping GitHub's real rate limits.
- Gist file `truncated`/`raw_url` behavior on very large files (GitHub truncates content over 1MB in the read response) - partially touched by the oversized-content validation test but not asserted on the read path.
- Concurrent/racing updates to the same gist (optimistic concurrency, `If-Match`/ETag semantics) - not exposed by this endpoint set in a testable way.
- Gist history / revisions endpoint (`/gists/{id}/{sha}`) - out of scope, no client method exists for it yet.
