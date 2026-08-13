import { test, expect, buildGistPayload } from '../../../src/fixtures';
import { createGist } from '../../../src/helpers/gistHelper';
import {
  createComment,
  createCommentResponse,
  deleteComment,
  deleteCommentResponse,
  listComments,
} from '../../../src/helpers/commentHelper';

test.describe('Gist comments', () => {
  test('create -> list -> delete a comment @smoke', async ({ gistClient }) => {
    const gist = await createGist(gistClient, buildGistPayload());

    const comment = await createComment(gistClient, gist.id, 'First comment');
    await test.step('Verify comment body and id', async () => {
      expect(comment.body).toBe('First comment');
      expect(comment.id).toBeTruthy();
    });

    const comments = await listComments(gistClient, gist.id);
    await test.step('Verify comment appears in the list', async () => {
      expect(comments.map((c) => c.id)).toContain(comment.id);
    });

    await deleteComment(gistClient, gist.id, comment.id);

    const commentsAfterDelete = await listComments(gistClient, gist.id);
    await test.step('Verify comment no longer appears in the list', async () => {
      expect(commentsAfterDelete.map((c) => c.id)).not.toContain(comment.id);
    });
  });

  test('a new gist has no comments @regression', async ({ gistClient }) => {
    const gist = await createGist(gistClient, buildGistPayload());

    const comments = await listComments(gistClient, gist.id);
    await test.step('Verify comment list is empty', async () => {
      expect(comments).toEqual([]);
    });
  });

  test('multiple comments are listed in creation order @regression', async ({ gistClient }) => {
    const gist = await createGist(gistClient, buildGistPayload());

    const first = await createComment(gistClient, gist.id, 'one');
    const second = await createComment(gistClient, gist.id, 'two');

    const comments = await listComments(gistClient, gist.id);
    await test.step('Verify comments are listed in creation order', async () => {
      const ids = comments.map((c) => c.id);
      expect(ids.indexOf(first.id)).toBeLessThan(ids.indexOf(second.id));
    });
  });

  test('deleting a comment on a nonexistent gist returns 404 @regression', async ({
    gistClient,
  }) => {
    await test.step('Verify deleting the comment returns 404', async () => {
      const response = await deleteCommentResponse(
        gistClient,
        '0000000000000000000000000000000000',
        1,
      );
      expect(response.status()).toBe(404);
    });
  });

  test('an empty comment body is rejected @regression', async ({ gistClient }) => {
    const gist = await createGist(gistClient, buildGistPayload());

    await test.step('Verify empty comment body is rejected', async () => {
      const response = await createCommentResponse(gistClient, gist.id, '');
      expect(response.status()).toBe(422);
    });
  });
});
