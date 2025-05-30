import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
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
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generate a JWT token
export const generateToken = (
  payload: JwtPayload,
  expiresInValue?: number,
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[generateToken] JWT_SECRET missing.");
    throw new Error("JWT_SECRET not set.");
  }

  const options: SignOptions = {};

  // Only set expiresIn if exp is NOT manually defined in payload
  if (!payload.exp && expiresInValue) {
    options.expiresIn = expiresInValue;
  }

  return jwt.sign(payload, secret, options);
};

// Verify a JWT token and return the payload
export const verifyToken = (
  token: string,
): (JwtPayload & { iat: number; exp: number }) | null => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[verifyToken] JWT_SECRET not set");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      iat: number;
      exp: number;
    };

    if (decoded?.userId && decoded?.email) {
      return decoded; // return full decoded token including exp
    }

    console.warn("Decoded token is missing fields:", decoded);
    return null;
  } catch (error: any) {
    console.error("verifyToken error:", error);
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

  if (
    !user ||
    typeof user !== "object" ||
    !("id" in user) ||
    typeof user.id !== "string" ||
    !("email" in user) ||
    typeof user.email !== "string"
  ) {
    return null;
  }
  return user as AuthUser;
};
