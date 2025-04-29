import { Context } from "hono";
import db from "../db";
import { hashPassword, comparePassword, generateToken } from "../lib/authUtils";
import { JwtPayload } from "../types";
import { sendApiResponse } from "../lib/responseUtils";

// --- Registration Handler ---
export const registerUser = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    // Basic Validation
    if (!email || !password) {
      return sendApiResponse(c, {
        status: 400,
        message: "Validation failed",
        data: null,
        metadata: null,
        errors: [
          {
            field: "email",
            message: "Email and password are required.",
          },
          {
            field: "password",
            message: "Email and password are required.",
          },
        ],
      });
    }
    // Add more validation (e.g., email format, password complexity) here
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendApiResponse(c, {
        status: 400,
        message: "Validation failed",
        data: null,
        metadata: null,
        errors: [
          {
            field: "email",
            message: "Invalid email format.",
          },
        ],
      });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendApiResponse(c, {
        status: 409,
        message: "Conflict",
        data: null,
        metadata: null,
        errors: [
          {
            field: "email",
            message: "Email already in use.",
          },
        ],
      });
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

    // seed defualt collection and tags
    await seedUserData(newUser.id);

    // Generate JWT
    const payload: JwtPayload = { userId: newUser.id, email: newUser.email };
    const token = generateToken(payload);

    // Send success response
    return sendApiResponse(c, {
      status: 201,
      message: "User registered successfully.",
      data: {
        token,
        user: { id: newUser.id, email: newUser.email },
      },
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message:
            error.message ||
            "An unexpected error occurred during registration.",
        },
      ],
    });
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
        400
      );
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return sendApiResponse(c, {
        status: 401,
        message: "Unauthorized",
        data: null,
        metadata: null,
        errors: [
          {
            field: "email",
            message: "Invalid email or password.",
          },
        ],
      }); // Generic message for security
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendApiResponse(c, {
        status: 401,
        message: "Unauthorized",
        data: null,
        metadata: null,
        errors: [
          {
            field: "password",
            message: "Invalid email or password.",
          },
        ],
      });
    }

    const payload: JwtPayload = { userId: user.id, email: user.email };
    const token = generateToken(payload);

    return sendApiResponse(c, {
      status: 200,
      message: "Login successful.",
      data: {
        token,
        user: { id: user.id, email: user.email },
      },
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message:
            error.message || "An unexpected error occurred during login.",
        },
      ],
    });
  }
};

const seedUserData = async (userId: string) => {
  const defaultCollections = ["Unsorted"];
  const defaultTags = ["Read Later", "Important", "Favorites"];

  const createCollections = defaultCollections.map((name) =>
    db.collection.create({
      data: {
        name: "Unsorted",
        userId: userId,
        isSystem: true,
      },
    })
  );

  // Run this once, before the schema change
  const tags = await db.tag.findMany({
    include: { user: true },
  });

  for (const tag of tags) {
    const userId = tag.userId;
    const name = tag.name;

    const existing = await db.tag.findFirst({ where: { userId, name } });
    if (existing) continue;

    // If not exists, clone it for the user
    await db.tag.create({
      data: {
        name,
        userId,
      },
    });
  }
  const createTags = defaultTags.map((name) =>
    db.tag.create({
      data: { name, userId },
    })
  );

  await Promise.all([...createCollections, ...createTags]);
};
