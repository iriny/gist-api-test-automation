import { test, buildGistPayload } from '../../../src/fixtures';
import { createGist } from '../../../src/helpers/gistHelper';
import {
  starGist,
  unstarGist,
  verifyGistIsNotStarred,
  verifyGistIsStarred,
} from '../../../src/helpers/starHelper';

test.describe('Gist stars', () => {
  test('star -> check starred -> unstar -> check not starred @smoke', async ({ gistClient }) => {
    const created = await createGist(gistClient, buildGistPayload());

    await verifyGistIsNotStarred(gistClient, created.id);
    await starGist(gistClient, created.id);
    await verifyGistIsStarred(gistClient, created.id);
    await unstarGist(gistClient, created.id);
    await verifyGistIsNotStarred(gistClient, created.id);
  });

  test('starring an already-starred gist is idempotent @regression', async ({ gistClient }) => {
    const created = await createGist(gistClient, buildGistPayload());

    await starGist(gistClient, created.id);
    await starGist(gistClient, created.id);
    await verifyGistIsStarred(gistClient, created.id);

    await unstarGist(gistClient, created.id);
  });

  test('unstarring a gist that was never starred returns 204 @regression', async ({
    gistClient,
  }) => {
    const created = await createGist(gistClient, buildGistPayload());

    await unstarGist(gistClient, created.id);
  });

  test('checking star status on a nonexistent gist returns 404 @regression', async ({
    gistClient,
  }) => {
    await verifyGistIsNotStarred(gistClient, '0000000000000000000000000000000000');
  });
});
