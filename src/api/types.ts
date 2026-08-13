export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
}

export interface GistFile {
  filename: string;
  type: string;
  language: string | null;
  raw_url: string;
  size: number;
  truncated?: boolean;
  content?: string;
  encoding?: string;
}

/** Body shape for a file inside a create/update payload - only `content` is writable. */
export interface GistFileInput {
  content?: string;
  filename?: string;
}

export interface Gist {
  url: string;
  forks_url: string;
  commits_url: string;
  id: string;
  node_id: string;
  git_pull_url: string;
  git_push_url: string;
  html_url: string;
  files: Record<string, GistFile | null>;
  public: boolean;
  created_at: string;
  updated_at: string;
  description: string | null;
  comments: number;
  comments_enabled?: boolean;
  user: GitHubUser | null;
  comments_url: string;
  owner?: GitHubUser;
  truncated?: boolean;
  /** Present (non-null) when this gist was created via the fork endpoint. */
  fork_of?: Gist | null;
  forks?: Gist[];
  history?: unknown[];
}

export interface GistComment {
  id: number;
  node_id: string;
  url: string;
  body: string;
  user: GitHubUser | null;
  created_at: string;
  updated_at: string;
  author_association: string;
}

export interface CreateGistPayload {
  description?: string;
  /** Keys are filenames; GitHub rejects an empty object. */
  files: Record<string, GistFileInput>;
  public?: boolean;
}

/**
 * Update payload only - GitHub allows renaming a file by keying the new name and
 * setting `filename` to the new value, or deleting a file by setting it to `null`.
 */
export interface UpdateGistPayload {
  description?: string;
  files?: Record<string, GistFileInput | { filename?: string; content?: string } | null>;
}

export interface ListGistsParams {
  since?: string;
  per_page?: number;
  page?: number;
}

export interface ApiError {
  message: string;
  documentation_url?: string;
  status?: string;
}
