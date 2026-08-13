import type { APIResponse } from '@playwright/test';
import { test, expect } from '../fixtures';
import type { GistApiClient } from '../api/GistApiClient';

export async function starGist(client: GistApiClient, gistId: string): Promise<void> {
  await test.step('Star gist via API', async () => {
    const response = await client.starGist(gistId);
    expect(response.status()).toBe(204);
  });
}

export async function starGistResponse(
  client: GistApiClient,
  gistId: string,
): Promise<APIResponse> {
  return test.step('Star gist via API', async () => {
    return client.starGist(gistId);
  });
}

export async function unstarGist(client: GistApiClient, gistId: string): Promise<void> {
  await test.step('Unstar gist via API', async () => {
    const response = await client.unstarGist(gistId);
    expect(response.status()).toBe(204);
  });
}

export async function verifyGistIsStarred(client: GistApiClient, gistId: string): Promise<void> {
  await test.step('Verify gist is starred', async () => {
    const response = await client.checkIfStarred(gistId);
    expect(response.status()).toBe(204);
  });
}

export async function verifyGistIsNotStarred(client: GistApiClient, gistId: string): Promise<void> {
  await test.step('Verify gist is not starred', async () => {
    const response = await client.checkIfStarred(gistId);
    expect(response.status()).toBe(404);
  });
}
