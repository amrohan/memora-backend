interface ApiError {
  field: string;
  message: string;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T | null;
  errors: ApiError[] | null;
  metadata: Record<string, any> | null; // or define a more specific metadata type
}

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
  metadata: Record<string, any> | null = null
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

// Example route handler (success):

// async function handleSuccess(c: Context) {
//   const userData = { id: 1, name: "example", email: "example@email.com" };
//   const response = createApiResponse(
//     200,
//     "User retrieved successfully",
//     userData
//   );
//   return sendApiResponse(c, response);
// }

// // Example route handler (error):

// async function handleError(c: Context) {
//   const errorList: ApiError[] = [{ field: "email", message: "Invalid email" }];
//   const response = createApiResponse(400, "Bad Request", null, errorList);
//   return sendApiResponse(c, response);
// }

// // Example route handler (created):

// async function handleCreated(c: Context) {
//   const newItem = { id: 2, name: "another example" };
//   const response = createApiResponse(201, "Item Created", newItem);
//   return sendApiResponse(c, response);
// }

// // Example route handler (server error):

// async function handleServerError(c: Context) {
//   const response = createApiResponse(500, "Internal Server Error");
//   return sendApiResponse(c, response);
// }

export { createApiResponse, sendApiResponse };
