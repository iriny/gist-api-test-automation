/**
 * GitHub's API rejects forking a gist you already own (422 Unprocessable Entity), so fork
 * tests need a target gist that belongs to someone else. octocat/Hello world! is GitHub's
 * own long-lived demo gist - public, unlikely to ever be deleted, and small enough to keep
 * assertions fast.
 */
export const OCTOCAT_HELLO_WORLD_GIST_ID = '6cad326836d38bd3a7ae';
