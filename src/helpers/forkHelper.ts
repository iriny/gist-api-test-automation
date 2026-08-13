import type { APIResponse } from '@playwright/test';
import { test, expect } from '../fixtures';
import type { GistApiClient } from '../api/GistApiClient';
import type { Gist } from '../api/types';

export async function forkGist(client: GistApiClient, gistId: string): Promise<Gist> {
  return test.step('Fork gist via API', async () => {
    const response = await client.forkGist(gistId);
    expect(response.status()).toBe(201);
    return response.json();
  });
}

export async function forkGistResponse(
  client: GistApiClient,
  gistId: string,
): Promise<APIResponse> {
  return test.step('Fork gist via API', async () => {
    return client.forkGist(gistId);
  });
}

export async function verifyGistListsForkInForksArray(
  client: GistApiClient,
  gistId: string,
  forkId: string,
): Promise<void> {
  await test.step('Verify gist lists the fork under its forks array', async () => {
    const response = await client.getGist(gistId);
    expect(response.status()).toBe(200);
    const gist: Gist = await response.json();
    expect((gist.forks ?? []).map((f) => f.id)).toContain(forkId);
  });
}
