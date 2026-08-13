import { test, expect } from '../../../src/fixtures';
import type { Gist } from '../../../src/api/types';
import { listPublicGists } from '../../../src/helpers/gistHelper';

// The public gist feed always has far more entries than any single test run could create,
// which makes it a reliable target for asserting pagination *mechanics* (page size, boundary
// clamping) independent of how many gists our own account happens to own.

test.describe('Pagination', () => {
  test('per_page controls the number of returned gists @smoke', async ({ gistClient }) => {
    const response = await listPublicGists(gistClient, { per_page: 5 });

    await test.step('Verify exactly 5 gists are returned', async () => {
      expect(response.status()).toBe(200);
      const gists: Gist[] = await response.json();
      expect(gists).toHaveLength(5);
    });
  });

  test('per_page=0 falls back to the default page size instead of erroring @regression', async ({
    gistClient,
  }) => {
    const response = await listPublicGists(gistClient, { per_page: 0 });

    await test.step('Verify response is 200 with a non-empty page', async () => {
      expect(response.status()).toBe(200);
      const gists: Gist[] = await response.json();
      expect(gists.length).toBeGreaterThan(0);
    });
  });

  test('a negative per_page falls back to the default page size instead of erroring @regression', async ({
    gistClient,
  }) => {
    const response = await listPublicGists(gistClient, { per_page: -1 });

    await test.step('Verify response is 200 with a non-empty page', async () => {
      expect(response.status()).toBe(200);
      const gists: Gist[] = await response.json();
      expect(gists.length).toBeGreaterThan(0);
    });
  });

  test('per_page is clamped to a maximum of 100 @regression', async ({ gistClient }) => {
    const response = await listPublicGists(gistClient, { per_page: 1000 });

    await test.step('Verify at most 100 gists are returned', async () => {
      expect(response.status()).toBe(200);
      const gists: Gist[] = await response.json();
      expect(gists.length).toBeLessThanOrEqual(100);
    });
  });

  test('page=0 and page=1 return the same first page @regression', async ({ gistClient }) => {
    // Fired concurrently (not sequentially) to shrink the window in which someone else's
    // new public gist could land between the two calls and shift the page.
    const [pageZeroResponse, pageOneResponse] = await Promise.all([
      listPublicGists(gistClient, { per_page: 5, page: 0 }),
      listPublicGists(gistClient, { per_page: 5, page: 1 }),
    ]);

    await test.step('Verify page=0 and page=1 return the same first page', async () => {
      const pageZero: Gist[] = await pageZeroResponse.json();
      const pageOne: Gist[] = await pageOneResponse.json();

      // The public feed is live and global, so a gist created by someone else mid-test
      // can shift the newest entry - tolerate one item of drift instead of requiring
      // byte-for-byte equality, which would make this test flaky by design.
      expect(pageZero).toHaveLength(pageOne.length);
      const overlap = pageZero.filter((g) => pageOne.some((p) => p.id === g.id));
      expect(overlap.length).toBeGreaterThanOrEqual(pageOne.length - 1);
    });
  });

  test('a page number far beyond the available range returns 422, not an empty page @regression', async ({
    gistClient,
  }) => {
    const response = await listPublicGists(gistClient, { per_page: 5, page: 999999 });

    await test.step('Verify response is 422', async () => {
      expect(response.status()).toBe(422);
    });
  });
});
