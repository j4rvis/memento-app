export interface ApiTokenPayload {
  sub: string; // userId
  instance_id: string;
  scopes: string[];
  iat: number;
  exp: number;
}

export interface ApiAuthResult {
  userId: string;
  instanceId: string;
  scopes: string[];
}

// Response envelope types

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: { total: number };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Scope constants
export const API_SCOPES = {
  TODOS_READ: "todos:read",
  TODOS_WRITE: "todos:write",
  BOOKMARKS_READ: "bookmarks:read",
  BOOKMARKS_WRITE: "bookmarks:write",
  FEEDS_READ: "feeds:read",
  FEEDS_WRITE: "feeds:write",
  GOOGLE_READ: "google:read",
  NEWSPAPER_WRITE: "newspaper:write",
  WILDCARD: "*",
} as const;
