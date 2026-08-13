import { test, expect } from '../../../src/fixtures';
import type { Gist } from '../../../src/api/types';
import {
  buildDuplicateFilenamesRawBody,
  buildOversizedContentPayload,
  buildUnicodeFilenamePayload,
  EMPTY_CONTENT_PAYLOAD,
  EMPTY_FILES_PAYLOAD,
  MALFORMED_JSON_BODY,
} from '../../../src/data/edgeCasePayloads';
import {
  createGist,
  createGistRawResponse,
  createGistResponse,
  getGist,
} from '../../../src/helpers/gistHelper';

test.describe('Validation edge cases', () => {
  test('an empty files object is rejected @smoke', async ({ gistClient }) => {
    const response = await createGistResponse(gistClient, EMPTY_FILES_PAYLOAD);

    await test.step('Verify response is 422', async () => {
      // GitHub's schema only requires the `files` key to be present, not that it be
      // non-empty - the emptiness check happens in application logic, so this is a 422
      // (validation_failed) rather than a 400.
      expect(response.status()).toBe(422);
    });
  });

  test('a file with empty string content is rejected @regression', async ({ gistClient }) => {
    const response = await createGistResponse(gistClient, EMPTY_CONTENT_PAYLOAD);

    await test.step('Verify response is 422', async () => {
      expect(response.status()).toBe(422);
    });
  });

  test('duplicate filename keys in the raw request collapse to the last value @regression', async ({
    gistClient,
  }) => {
    // JS objects can't hold duplicate keys, so this is sent as a raw JSON string - see
    // src/data/edgeCasePayloads.ts for why.
    const response = await createGistRawResponse(gistClient, buildDuplicateFilenamesRawBody());

    const gist =
      await test.step('Verify gist is created with a single collapsed file', async () => {
        expect(response.status()).toBe(201);
        const created = await response.json();
        expect(Object.keys(created.files)).toEqual(['duplicate.txt']);
        return created;
      });

    const fetched = await getGist(gistClient, gist.id);
    await test.step('Verify the last duplicate value won', async () => {
      expect(fetched.files['duplicate.txt']?.content).toBe('second');
    });
  });

  test('unicode and emoji in filename and content are preserved @smoke', async ({ gistClient }) => {
    const created = await createGist(gistClient, buildUnicodeFilenamePayload());

    const filename = await test.step('Verify filename is preserved as unicode', async () => {
      const [name] = Object.keys(created.files);
      if (!name) throw new Error('expected the created gist to have exactly one file');
      expect(name).toBe('日本語ファイル😀.md');
      return name;
    });

    const fetched = await getGist(gistClient, created.id);
    await test.step('Verify emoji content is preserved', async () => {
      expect(fetched.files[filename]?.content).toContain('🎉🚀');
    });
  });

  test('oversized (~1MB) file content is accepted or explicitly rejected, never silently corrupted @regression', async ({
    gistClient,
  }) => {
    const response = await createGistResponse(gistClient, buildOversizedContentPayload());

    await test.step('Verify response is a well-defined outcome, not silent corruption', async () => {
      // GitHub does not document a hard per-file size limit for gist content created via
      // this endpoint; we assert it's handled as one of these two well-defined outcomes
      // rather than assuming a specific one.
      expect([201, 413, 422]).toContain(response.status());
      if (response.status() === 201) {
        const gist: Gist = await response.json();
        const [file] = Object.values(gist.files);
        expect(file?.size).toBe(1024 * 1024);
      }
    });
  });

  test('a malformed JSON request body returns 422 @smoke', async ({ gistClient }) => {
    // GitHub treats an unparseable body as a validation failure (422), not a 400.
    const response = await createGistRawResponse(gistClient, MALFORMED_JSON_BODY);

    await test.step('Verify response is 422', async () => {
      expect(response.status()).toBe(422);
    });
  });
});
