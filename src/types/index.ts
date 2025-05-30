// Payload structure for JWT
export interface JwtPayload {
  userId: string;
  email: string;
  exp: number;
}

// Structure to attach to Hono context after authentication
export interface AuthUser {
  id: string;
  email: string;
}
