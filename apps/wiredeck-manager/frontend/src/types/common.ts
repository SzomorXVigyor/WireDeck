/**
 * Shared API response types used across all domain modules.
 */

/** Generic envelope returned by the backend for most write operations. */
export interface ApiResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

/** Wraps a typed payload together with the common API metadata. */
export interface ApiDataResponse<T> extends ApiResponse {
  data?: T;
}
