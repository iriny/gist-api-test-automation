import { test as base, request as playwrightRequest } from '@playwright/test';
import * as dotenv from 'dotenv';
import type { APIRequestContext } from '@playwright/test';
import { GistApiClient } from '../api/GistApiClient';
import type { CreateGistPayload, GistFileInput } from '../api/types';

dotenv.config({ quiet: true });

const BASE_URL = process.env.BASE_URL ?? 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';

const commonHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

/**
 * Builds a valid create-gist payload with sensible defaults. Pass `overrides` to change
 * just the fields a test cares about (e.g. `buildGistPayload({ public: false })`). The
 * description carries a timestamp so gists created by different test runs are distinct and
 * identifiable in the account, rather than piling up under one identical description.
 */
export function buildGistPayload(overrides: Partial<CreateGistPayload> = {}): CreateGistPayload {
  const defaultFiles: Record<string, GistFileInput> = {
    'hello.txt': { content: 'Hello, Gist!' },
  };
  return {
    description: `Created by gist-api-test-automation - ${new Date().toISOString()}`,
    public: true,
    files: defaultFiles,
    ...overrides,
  };
}

/**
 * Same client surface as GistApiClient, but remembers the id of every gist it creates -
 * via createGist, createGistRaw, or forkGist - so the `gistClient` fixture can delete them
 * after the test. This is what makes cleanup automatic instead of something every spec has
 * to remember to do, and it runs whether the test passed, failed, or threw.
 */
class TrackedGistApiClient extends GistApiClient {
  readonly createdGistIds: string[] = [];

  override async createGist(payload: CreateGistPayload) {
    const response = await super.createGist(payload);
    if (response.ok()) {
      this.createdGistIds.push((await response.json()).id);
    }
    return response;
  }

  override async createGistRaw(rawBody: string) {
    const response = await super.createGistRaw(rawBody);
    if (response.ok()) {
      this.createdGistIds.push((await response.json()).id);
    }
    return response;
  }

  override async forkGist(gistId: string) {
    const response = await super.forkGist(gistId);
    if (response.ok()) {
      this.createdGistIds.push((await response.json()).id);
    }
    return response;
  }
}

interface GistFixtures {
  /** Authenticated client that auto-deletes any gist it created, even if the test fails. */
  gistClient: TrackedGistApiClient;
  /** Client with no Authorization header, for testing unauthenticated access. */
  unauthenticatedGistClient: GistApiClient;
  /** Client sending a syntactically valid but invalid/expired-looking token. */
  invalidTokenGistClient: GistApiClient;
}

async function newApiContext(headers: Record<string, string>): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { ...commonHeaders, ...headers },
  });
}

export const test = base.extend<GistFixtures>({
  gistClient: async ({}, use) => {
    const apiContext = await newApiContext({ Authorization: `Bearer ${GITHUB_TOKEN}` });
    const client = new TrackedGistApiClient(apiContext);

    await use(client);

    for (const gistId of client.createdGistIds) {
      await client.deleteGist(gistId).catch(() => {
        // best-effort cleanup - a gist already deleted by the test itself is not an error
      });
    }
    await apiContext.dispose();
  },

  unauthenticatedGistClient: async ({}, use) => {
    const apiContext = await newApiContext({});
    await use(new GistApiClient(apiContext));
    await apiContext.dispose();
  },

  invalidTokenGistClient: async ({}, use) => {
    const apiContext = await newApiContext({
      Authorization: 'Bearer ghp_invalidtoken000000000000000000',
    });
    await use(new GistApiClient(apiContext));
    await apiContext.dispose();
  },
});

export { expect } from '@playwright/test';
