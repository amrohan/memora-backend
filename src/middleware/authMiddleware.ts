import { Context, Next } from "hono";
import { verifyToken } from "../lib/authUtils";
import { AuthUser } from "../types";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      { error: "Unauthorized", message: "Bearer token is missing or invalid." },
      401
    );
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ error: "Unauthorized", message: "Token is missing." }, 401);
  }

  const decodedPayload = verifyToken(token);

  if (!decodedPayload) {
    return c.json(
      { error: "Unauthorized", message: "Invalid or expired token." },
      401
    );
  }

  // Attach user info to the context for use in subsequent handlers
  const user: AuthUser = {
    id: decodedPayload.userId,
    email: decodedPayload.email,
  };
  c.set("user", user); // Use c.set for context passing in Hono

  await next(); // Proceed to the next middleware or route handler
};
