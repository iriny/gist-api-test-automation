import { test, expect, buildGistPayload } from '../../../src/fixtures';
import type { ApiError } from '../../../src/api/types';
import {
  createGist,
  createGistResponse,
  deleteGistResponse,
  listGists,
} from '../../../src/helpers/gistHelper';
import { starGistResponse } from '../../../src/helpers/starHelper';

test.describe('Authentication', () => {
  test('creating a gist with a valid token succeeds @smoke', async ({ gistClient }) => {
    await createGist(gistClient, buildGistPayload());
  });

  test('creating a gist without a token returns 401 @smoke', async ({
    unauthenticatedGistClient,
  }) => {
    const response = await createGistResponse(unauthenticatedGistClient, {
      files: { 'a.txt': { content: 'x' } },
    });

    await test.step('Verify response is 401 with "Requires authentication"', async () => {
      expect(response.status()).toBe(401);
      const body: ApiError = await response.json();
      expect(body.message).toBe('Requires authentication');
    });
  });

  test('creating a gist with an invalid token returns 401 @smoke', async ({
    invalidTokenGistClient,
  }) => {
    const response = await createGistResponse(invalidTokenGistClient, {
      files: { 'a.txt': { content: 'x' } },
    });

    await test.step('Verify response is 401 with "Bad credentials"', async () => {
      expect(response.status()).toBe(401);
      const body: ApiError = await response.json();
      expect(body.message).toBe('Bad credentials');
    });
  });

  test('deleting a gist without a token returns 401 @regression', async ({
    unauthenticatedGistClient,
  }) => {
    const response = await deleteGistResponse(unauthenticatedGistClient, 'anygistid00000000000000');

    await test.step('Verify response is 401', async () => {
      expect(response.status()).toBe(401);
    });
  });

  test('starring a gist with an invalid token returns 401 @regression', async ({
    invalidTokenGistClient,
  }) => {
    const response = await starGistResponse(invalidTokenGistClient, 'anygistid00000000000000');

    await test.step('Verify response is 401', async () => {
      expect(response.status()).toBe(401);
    });
  });

  // GET /gists is documented as "list gists for the authenticated user", but the endpoint
  // does not actually require a token - unauthenticated it silently falls back to the
  // public feed instead of erroring. Worth asserting explicitly so this doesn't get
  // "fixed" into a 401 by a well-meaning future change to the fixture/client.
  test('listing gists without a token falls back to the public feed instead of 401 @regression', async ({
    unauthenticatedGistClient,
  }) => {
    const response = await listGists(unauthenticatedGistClient);

    await test.step('Verify response is 200', async () => {
      expect(response.status()).toBe(200);
    });
  });
});
