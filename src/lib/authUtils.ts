import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthUser, JwtPayload } from "../types";
import { Context } from "hono";

const SALT_ROUNDS = 10;

// Hash a plain text password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare a plain text password with a hash
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generate a JWT token
export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  // Consider adding expiration time: expiresIn: '1h' or similar
  return jwt.sign(payload, secret, { expiresIn: "7d" }); // Example: 7 day expiration
};

// Verify a JWT token and return the payload
export const verifyToken = (token: string): JwtPayload | null => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error(
      "JWT_SECRET environment variable is not set for verification."
    );
    return null;
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      iat: number;
      exp: number;
    };
    // Ensure essential payload fields exist
    if (decoded && decoded.userId && decoded.email) {
      // Return only the necessary payload fields
      return { userId: decoded.userId, email: decoded.email };
    }
    return null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};

/**
 * Safely retrieves and validates the authenticated user object from Hono context.
 * Assumes 'user' is set by authMiddleware.
 * @param c Hono context object
 * @returns The validated AuthUser object or null if validation fails or user is not found.
 */
export const getAuthUser = (c: Context): AuthUser | null => {
  const user = c.get("user");

  // Add robust type checking
  if (
    !user ||
    typeof user !== "object" ||
    !("id" in user) ||
    typeof user.id !== "string" ||
    !("email" in user) ||
    typeof user.email !== "string"
  ) {
    console.error("Invalid or missing user object structure in context:", user);
    return null;
  }
  // If it passes checks, cast it to the expected type
  return user as AuthUser;
};
