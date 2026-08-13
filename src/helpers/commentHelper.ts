import type { APIResponse } from '@playwright/test';
import { test, expect } from '../fixtures';
import type { GistApiClient } from '../api/GistApiClient';
import type { GistComment } from '../api/types';

export async function createComment(
  client: GistApiClient,
  gistId: string,
  body: string,
): Promise<GistComment> {
  return test.step(`Create comment "${body}" via API`, async () => {
    const response = await client.createComment(gistId, body);
    expect(response.status()).toBe(201);
    return response.json();
  });
}

export async function createCommentResponse(
  client: GistApiClient,
  gistId: string,
  body: string,
): Promise<APIResponse> {
  return test.step('Create comment via API', async () => {
    return client.createComment(gistId, body);
  });
}

export async function listComments(client: GistApiClient, gistId: string): Promise<GistComment[]> {
  return test.step('List comments via API', async () => {
    const response = await client.listComments(gistId);
    expect(response.status()).toBe(200);
    return response.json();
  });
}

export async function deleteComment(
  client: GistApiClient,
  gistId: string,
  commentId: number,
): Promise<void> {
  await test.step('Delete comment via API', async () => {
    const response = await client.deleteComment(gistId, commentId);
    expect(response.status()).toBe(204);
  });
}

export async function deleteCommentResponse(
  client: GistApiClient,
  gistId: string,
  commentId: number,
): Promise<APIResponse> {
  return test.step('Delete comment via API', async () => {
    return client.deleteComment(gistId, commentId);
  });
}
