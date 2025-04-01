import { Context } from "hono";
import db from "../db";
import { hashPassword, comparePassword, generateToken } from "../lib/authUtils";
import { JwtPayload } from "../types";

// --- Registration Handler ---
export const registerUser = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    // Basic Validation
    if (!email || !password) {
      return c.json(
        {
          error: "Validation failed",
          message: "Email and password are required.",
        },
        400,
      );
    }
    // Add more validation (e.g., email format, password complexity) here

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json(
        { error: "Conflict", message: "User with this email already exists." },
        409,
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await db.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Generate JWT
    const payload: JwtPayload = { userId: newUser.id, email: newUser.email };
    const token = generateToken(payload);

    return c.json(
      {
        message: "User registered successfully.",
        token: token,
        user: { id: newUser.id, email: newUser.email },
      },
      201,
    ); // 201 Created
  } catch (error: any) {
    console.error("Registration Error:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message:
          error.message || "An unexpected error occurred during registration.",
      },
      500,
    );
  }
};

// --- Login Handler ---
export const loginUser = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    // Basic Validation
    if (!email || !password) {
      return c.json(
        {
          error: "Validation failed",
          message: "Email and password are required.",
        },
        400,
      );
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return c.json(
        { error: "Unauthorized", message: "Invalid email or password." },
        401,
      ); // Generic message for security
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return c.json(
        { error: "Unauthorized", message: "Invalid email or password." },
        401,
      );
    }

    // Generate JWT
    const payload: JwtPayload = { userId: user.id, email: user.email };
    const token = generateToken(payload);

    // Return success response
    return c.json({
      message: "Login successful.",
      token: token,
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: error.message || "An unexpected error occurred during login.",
      },
      500,
    );
  }
};
