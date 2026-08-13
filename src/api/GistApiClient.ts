import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { CreateGistPayload, ListGistsParams, UpdateGistPayload } from './types';

/** Drops undefined entries so optional query params satisfy Playwright's params type. */
function toQueryParams(params: ListGistsParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;
}

/**
 * Thin wrapper around the GitHub REST API's Gists resource. Every method returns the raw
 * Playwright `APIResponse` (unawaited on status) so specs stay in control of what they
 * assert - status code, headers, or body shape. No assertions live in this file.
 */
export class GistApiClient {
  constructor(private readonly request: APIRequestContext) {}

  createGist(payload: CreateGistPayload): Promise<APIResponse> {
    return this.request.post('/gists', { data: payload });
  }

  /** Sends a raw, unserialized body - used to exercise malformed-JSON handling. */
  createGistRaw(rawBody: string): Promise<APIResponse> {
    return this.request.post('/gists', {
      data: rawBody,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getGist(gistId: string): Promise<APIResponse> {
    return this.request.get(`/gists/${gistId}`);
  }

  listGists(params: ListGistsParams = {}): Promise<APIResponse> {
    return this.request.get('/gists', { params: toQueryParams(params) });
  }

  listPublicGists(params: ListGistsParams = {}): Promise<APIResponse> {
    return this.request.get('/gists/public', { params: toQueryParams(params) });
  }

  listStarredGists(params: ListGistsParams = {}): Promise<APIResponse> {
    return this.request.get('/gists/starred', { params: toQueryParams(params) });
  }

  updateGist(gistId: string, payload: UpdateGistPayload): Promise<APIResponse> {
    return this.request.patch(`/gists/${gistId}`, { data: payload });
  }

  deleteGist(gistId: string): Promise<APIResponse> {
    return this.request.delete(`/gists/${gistId}`);
  }

  starGist(gistId: string): Promise<APIResponse> {
    return this.request.put(`/gists/${gistId}/star`);
  }

  unstarGist(gistId: string): Promise<APIResponse> {
    return this.request.delete(`/gists/${gistId}/star`);
  }

  /** GitHub semantics: 204 = starred, 404 = not starred. */
  checkIfStarred(gistId: string): Promise<APIResponse> {
    return this.request.get(`/gists/${gistId}/star`);
  }

  forkGist(gistId: string): Promise<APIResponse> {
    return this.request.post(`/gists/${gistId}/forks`);
  }

  listComments(gistId: string, params: ListGistsParams = {}): Promise<APIResponse> {
    return this.request.get(`/gists/${gistId}/comments`, { params: toQueryParams(params) });
  }

  createComment(gistId: string, body: string): Promise<APIResponse> {
    return this.request.post(`/gists/${gistId}/comments`, { data: { body } });
  }

  deleteComment(gistId: string, commentId: number): Promise<APIResponse> {
    return this.request.delete(`/gists/${gistId}/comments/${commentId}`);
  }
}
