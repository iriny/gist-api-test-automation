import { test, expect, buildGistPayload } from '../../../src/fixtures';
import {
  createGist,
  verifyGistNotInPublicListing,
  verifyGistPublicStatus,
} from '../../../src/helpers/gistHelper';

test.describe('Gist visibility', () => {
  test('a public gist is fetchable by id and marked public @smoke', async ({ gistClient }) => {
    const created = await createGist(gistClient, buildGistPayload({ public: true }));
    await test.step('Verify created gist is public', async () => {
      expect(created.public).toBe(true);
    });

    await verifyGistPublicStatus(gistClient, created.id, true);
  });

  test('a secret gist is fetchable by id but marked not public @smoke', async ({ gistClient }) => {
    const created = await createGist(gistClient, buildGistPayload({ public: false }));
    await test.step('Verify created gist is not public', async () => {
      expect(created.public).toBe(false);
    });

    await verifyGistPublicStatus(gistClient, created.id, false);
  });

  test('a secret gist does not appear in the public gist listing @regression', async ({
    gistClient,
  }) => {
    const created = await createGist(
      gistClient,
      buildGistPayload({ public: false, description: `secret-${Date.now()}` }),
    );

    // The public feed is global and effectively unbounded, so we only assert the negative:
    // our own secret gist must never surface there, not that we've scanned every page.
    await verifyGistNotInPublicListing(gistClient, created.id);
  });

  test('omitting the public flag defaults to a non-public gist @regression', async ({
    gistClient,
  }) => {
    const { public: _omitted, ...payloadWithoutPublic } = buildGistPayload();
    const created = await createGist(gistClient, payloadWithoutPublic);

    await test.step('Verify gist defaults to not public', async () => {
      expect(created.public).toBe(false);
    });
  });
});
