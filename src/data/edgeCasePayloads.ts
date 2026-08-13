import type { CreateGistPayload } from '../api/types';

/** Unicode/emoji payload builder - timestamped since a successful call persists a gist. */
export function buildUnicodeFilenamePayload(): CreateGistPayload {
  return {
    description: `Unicode filename and content edge case - ${new Date().toISOString()}`,
    public: true,
    files: {
      '日本語ファイル😀.md': { content: '# こんにちは世界 🌍\nÜnïcödé çontent with emoji 🎉🚀' },
    },
  };
}

export const EMPTY_CONTENT_PAYLOAD: CreateGistPayload = {
  description: 'Empty file content edge case',
  public: true,
  files: {
    'empty.txt': { content: '' },
  },
};

export const EMPTY_FILES_PAYLOAD: CreateGistPayload = {
  description: 'Empty files object edge case',
  public: true,
  files: {},
};

/**
 * ~1MB single-file payload builder, to probe how the API handles oversized content -
 * timestamped since GitHub may accept it (201) and persist a gist.
 */
export function buildOversizedContentPayload(): CreateGistPayload {
  return {
    description: `Oversized file content edge case (~1MB) - ${new Date().toISOString()}`,
    public: true,
    files: {
      'huge.txt': { content: 'x'.repeat(1024 * 1024) },
    },
  };
}

/**
 * A JSON object literal can't actually hold two keys with the same name - by the time it
 * exists as a JS object, the second value has already won. To exercise the server's real
 * behavior we send hand-written raw JSON text with a duplicate key, exactly as a
 * misbehaving client might. Built fresh (with a timestamp) each call since a successful
 * call persists a gist.
 */
export function buildDuplicateFilenamesRawBody(): string {
  return `{
  "description": "Duplicate filename keys edge case - ${new Date().toISOString()}",
  "public": true,
  "files": {
    "duplicate.txt": { "content": "first" },
    "duplicate.txt": { "content": "second" }
  }
}`;
}

/** Deliberately truncated JSON (missing closing braces) to exercise malformed-body handling. */
export const MALFORMED_JSON_BODY = `{
  "description": "malformed body edge case",
  "files": { "a.txt": { "content": "oops"`;
