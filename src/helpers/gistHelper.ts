import type { APIResponse } from '@playwright/test';
import { test, expect } from '../fixtures';
import type { GistApiClient } from '../api/GistApiClient';
import type { CreateGistPayload, Gist, ListGistsParams, UpdateGistPayload } from '../api/types';

/**
 * Core gist CRUD helpers, reused across every domain (crud, visibility, stars, comments,
 * forks, auth, validation) - any spec that needs a gist to exist, or needs to exercise an
 * operation against one, goes through here rather than calling GistApiClient directly.
 *
 * Each action has two forms: the plain name (e.g. `createGist`) asserts the
 * happy-path status and returns the parsed body - use it for setup. The `*Response` form
 * (e.g. `createGistResponse`) makes no assumption about the outcome and returns the
 * raw `APIResponse` - use it when the test itself is asserting on the status code or error
 * body (auth failures, validation edge cases, etc).
 */

export async function createGist(client: GistApiClient, payload: CreateGistPayload): Promise<Gist> {
  return test.step(`Create gist "${payload.description ?? 'untitled'}" via API`, async () => {
    const response = await client.createGist(payload);
    expect(response.status()).toBe(201);
    return response.json();
  });
}

export async function createGistResponse(
  client: GistApiClient,
  payload: CreateGistPayload,
): Promise<APIResponse> {
  return test.step('Create gist via API', async () => {
    return client.createGist(payload);
  });
}

export async function createGistRawResponse(
  client: GistApiClient,
  rawBody: string,
): Promise<APIResponse> {
  return test.step('Create gist with raw body via API', async () => {
    return client.createGistRaw(rawBody);
  });
}

export async function getGist(client: GistApiClient, gistId: string): Promise<Gist> {
  return test.step('Get gist via API', async () => {
    const response = await client.getGist(gistId);
    expect(response.status()).toBe(200);
    return response.json();
  });
}

export async function getGistResponse(client: GistApiClient, gistId: string): Promise<APIResponse> {
  return test.step('Get gist via API', async () => {
    return client.getGist(gistId);
  });
}

export async function updateGist(
  client: GistApiClient,
  gistId: string,
  payload: UpdateGistPayload,
): Promise<Gist> {
  return test.step('Update gist via API', async () => {
    const response = await client.updateGist(gistId, payload);
    expect(response.status()).toBe(200);
    return response.json();
  });
}

export async function deleteGist(client: GistApiClient, gistId: string): Promise<void> {
  await test.step('Delete gist via API', async () => {
    const response = await client.deleteGist(gistId);
    expect(response.status()).toBe(204);
  });
}

export async function deleteGistResponse(
  client: GistApiClient,
  gistId: string,
): Promise<APIResponse> {
  return test.step('Delete gist via API', async () => {
    return client.deleteGist(gistId);
  });
}

export async function verifyGistNotFound(client: GistApiClient, gistId: string): Promise<void> {
  await test.step('Verify gist is not found', async () => {
    const response = await client.getGist(gistId);
    expect(response.status()).toBe(404);
  });
}

export async function verifyGistPublicStatus(
  client: GistApiClient,
  gistId: string,
  expectedPublic: boolean,
): Promise<void> {
  await test.step(`Verify gist is ${expectedPublic ? 'public' : 'not public'}`, async () => {
    const response = await client.getGist(gistId);
    expect(response.status()).toBe(200);
    const gist: Gist = await response.json();
    expect(gist.public).toBe(expectedPublic);
  });
}

export async function listGists(
  client: GistApiClient,
  params: ListGistsParams = {},
): Promise<APIResponse> {
  return test.step('List gists via API', async () => {
    return client.listGists(params);
  });
}

export async function listPublicGists(
  client: GistApiClient,
  params: ListGistsParams = {},
): Promise<APIResponse> {
  return test.step('List public gists via API', async () => {
    return client.listPublicGists(params);
  });
}

export async function verifyGistNotInPublicListing(
  client: GistApiClient,
  gistId: string,
): Promise<void> {
  await test.step('Verify gist does not appear in the public gist listing', async () => {
    const response = await client.listPublicGists({ per_page: 100 });
    expect(response.status()).toBe(200);
    const gists: Gist[] = await response.json();
    expect(gists.map((g) => g.id)).not.toContain(gistId);
  });
}
