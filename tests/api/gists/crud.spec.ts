import { test, expect, buildGistPayload } from '../../../src/fixtures';
import {
  createGist,
  deleteGist,
  deleteGistResponse,
  getGist,
  updateGist,
  verifyGistNotFound,
} from '../../../src/helpers/gistHelper';

test.describe('Gist CRUD lifecycle', () => {
  test('create -> read -> update -> delete a gist @smoke', async ({ gistClient }) => {
    const payload = buildGistPayload({ description: 'CRUD lifecycle test gist' });

    const created = await createGist(gistClient, payload);
    await test.step('Verify created gist matches the payload', async () => {
      expect(created.id).toBeTruthy();
      expect(created.description).toBe(payload.description);
      expect(created.public).toBe(true);
      expect(Object.keys(created.files)).toEqual(['hello.txt']);
      expect(created.files['hello.txt']?.content).toBe('Hello, Gist!'); // create response echoes content back
    });

    const fetched = await getGist(gistClient, created.id);
    await test.step('Verify fetched gist matches the created gist', async () => {
      expect(fetched.id).toBe(created.id);
      expect(fetched.files['hello.txt']?.content).toBe('Hello, Gist!');
    });

    const updated = await updateGist(gistClient, created.id, {
      description: 'Updated description',
      files: { 'hello.txt': { content: 'Updated content' } },
    });
    await test.step('Verify gist reflects the update', async () => {
      expect(updated.description).toBe('Updated description');
      expect(updated.files['hello.txt']?.content).toBe('Updated content');
      expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(created.created_at).getTime(),
      );
    });

    await deleteGist(gistClient, created.id);
    await verifyGistNotFound(gistClient, created.id);
  });

  test('creates a gist with multiple files and no description @regression', async ({
    gistClient,
  }) => {
    const created = await createGist(gistClient, {
      public: true,
      files: {
        'a.txt': { content: 'file a' },
        'b.md': { content: '# file b' },
      },
    });

    await test.step('Verify gist has no description and both files', async () => {
      expect(created.description).toBeNull();
      expect(Object.keys(created.files).sort()).toEqual(['a.txt', 'b.md']);
    });
  });

  test('renames a file and removes another via update @regression', async ({ gistClient }) => {
    const created = await createGist(
      gistClient,
      buildGistPayload({
        files: {
          'keep.txt': { content: 'keep me' },
          'remove.txt': { content: 'remove me' },
        },
      }),
    );

    const updated = await updateGist(gistClient, created.id, {
      files: {
        'keep.txt': { filename: 'renamed.txt' },
        'remove.txt': null,
      },
    });

    await test.step('Verify only the renamed file remains', async () => {
      expect(Object.keys(updated.files)).toEqual(['renamed.txt']);
    });
  });

  test('deleting a gist twice returns 404 on the second call @regression', async ({
    gistClient,
  }) => {
    const created = await createGist(gistClient, buildGistPayload());

    await deleteGist(gistClient, created.id);

    await test.step('Verify the second delete returns 404', async () => {
      const secondDelete = await deleteGistResponse(gistClient, created.id);
      expect(secondDelete.status()).toBe(404);
    });
  });

  test('getting a nonexistent gist id returns 404 @regression', async ({ gistClient }) => {
    await verifyGistNotFound(gistClient, '0000000000000000000000000000000000');
  });
});
