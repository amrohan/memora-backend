// Define types used across the application, especially for context/payloads

// Payload structure for JWT
export interface JwtPayload {
  userId: string;
  email: string;
}

// Structure to attach to Hono context after authentication
export interface AuthUser {
  id: string;
  email: string;
}
