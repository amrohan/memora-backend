interface ApiError {
  field: string;
  message: string;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T | null;
  errors: ApiError[] | null;
  metadata: ApiResponseMetadata | null; // or define a more specific metadata type
}

export type ApiResponseMetadata = {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
};

/**
 * Creates a standardized API response object.
 *
 * @param {number} status - The HTTP status code (e.g., 200, 400, 500).
 * @param {string} message - A message describing the response.
 * @param {T | null} [data=null] - The data payload.
 * @param {ApiError[] | null} [errors=null] - An array of error objects.
 * @param {Record<string, any> | null} [metadata=null] - Optional metadata.
 * @returns {ApiResponse<T>} - The API response object.
 */
function createApiResponse<T>(
  status: number,
  message: string,
  data: T | null = null,
  errors: ApiError[] | null = null,
  metadata: ApiResponseMetadata | null = null
): ApiResponse<T> {
  return {
    status,
    message,
    data,
    errors,
    metadata,
  };
}

// Example usage in Hono (or similar):

import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

function sendApiResponse<T>(c: Context, response: ApiResponse<T>): Response {
  return c.json(response, response.status as ContentfulStatusCode); // Explicitly cast
}

export { createApiResponse, sendApiResponse };
