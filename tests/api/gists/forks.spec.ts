import { test, expect } from '../../../src/fixtures';
import { OCTOCAT_HELLO_WORLD_GIST_ID } from '../../../src/data/wellKnownGists';
import { createGist, getGist } from '../../../src/helpers/gistHelper';
import {
  forkGist,
  forkGistResponse,
  verifyGistListsForkInForksArray,
} from '../../../src/helpers/forkHelper';

// GitHub rejects forking a gist you already own, so these tests fork a stable, well-known
// public gist rather than one created by the test account. See src/data/wellKnownGists.ts.

test.describe('Gist forks', () => {
  test('forking a gist creates a new gist linked back to the original @smoke', async ({
    gistClient,
  }) => {
    const original = await getGist(gistClient, OCTOCAT_HELLO_WORLD_GIST_ID);

    const fork = await forkGist(gistClient, OCTOCAT_HELLO_WORLD_GIST_ID);
    await test.step('Verify fork has the same files as the original', async () => {
      expect(fork.id).not.toBe(original.id);
      expect(Object.keys(fork.files)).toEqual(Object.keys(original.files));
    });

    // `POST .../forks` returns GitHub's "base-gist" shape, which omits `fork_of` - only
    // `GET /gists/{id}` ("gist-simple") includes it, so we re-fetch to check the linkage.
    const refetchedFork = await getGist(gistClient, fork.id);
    await test.step('Verify refetched fork is linked back to the original', async () => {
      expect(refetchedFork.fork_of?.id).toBe(original.id);
    });
  });

  test('the original gist lists the fork under its forks array @regression', async ({
    gistClient,
  }) => {
    const fork = await forkGist(gistClient, OCTOCAT_HELLO_WORLD_GIST_ID);

    await verifyGistListsForkInForksArray(gistClient, OCTOCAT_HELLO_WORLD_GIST_ID, fork.id);
  });

  test('forking your own gist is rejected @regression', async ({ gistClient }) => {
    const ownGist = await createGist(gistClient, {
      public: true,
      files: { 'own.txt': { content: 'my own gist' } },
    });

    await test.step('Verify forking own gist is rejected', async () => {
      const response = await forkGistResponse(gistClient, ownGist.id);
      expect(response.status()).toBe(422);
    });
  });

  test('forking a nonexistent gist returns 404 @regression', async ({ gistClient }) => {
    await test.step('Verify forking a nonexistent gist returns 404', async () => {
      const response = await forkGistResponse(gistClient, '0000000000000000000000000000000000');
      expect(response.status()).toBe(404);
    });
  });
});
