import { Context } from "hono";
import db from "../db";
import {
  hashPassword,
  comparePassword,
  generateToken,
  getAuthUser,
  verifyToken,
} from "../lib/authUtils";
import { JwtPayload } from "../types";
import { sendApiResponse } from "../lib/responseUtils";
import { sendAccessCode, sendForgotPasswordEmail } from "../lib/mailer";
import { generateAccessCode } from "../lib/helpers";

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

    // seed default collection and tags
    await seedUserData(newUser.id);

    // Generate JWT for immediate login
    const payload: JwtPayload = {
      userId: newUser.id,
      email: newUser.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = generateToken(payload); // Uses default expiry (e.g., 7d)

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
      return sendApiResponse(c, {
        status: 400,
        message: "Validation failed",
        data: null,
        metadata: null,
        errors: [
          { field: "email", message: "Email is required." },
          { field: "password", message: "Password is required." },
        ],
      });
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
            field: "credentials", // Generic field for login attempts
            message: "Invalid email or password.",
          },
        ],
      });
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
            field: "credentials",
            message: "Invalid email or password.",
          },
        ],
      });
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 604800,
    };
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

export const resetPassword = async (c: Context) => {
  try {
    const authUser = getAuthUser(c);

    if (!authUser) {
      return sendApiResponse(c, {
        status: 401,
        message: "Unauthorized",
        data: null,
        metadata: null,
        errors: [
          {
            field: "user",
            message: "User not authenticated.", // More specific message
          },
        ],
      });
    }

    const { currentPassword, newPassword } = await c.req.json();

    // Basic Validation
    if (!currentPassword || !newPassword) {
      return sendApiResponse(c, {
        status: 400,
        message: "Validation failed",
        data: null,
        metadata: null,
        errors: [
          {
            field: "currentPassword",
            message: !currentPassword
              ? "Current password is required."
              : "Current password and new password are required.",
          },
          {
            field: "newPassword",
            message: !newPassword
              ? "New password is required."
              : "Current password and new password are required.",
          },
        ],
      });
    }
    // Find user by ID
    const existingUser = await db.user.findUnique({
      where: { id: authUser.id },
    });
    if (!existingUser) {
      // This case should ideally not happen if getAuthUser works based on a valid token
      return sendApiResponse(c, {
        status: 404,
        message: "User not found",
        data: null,
        metadata: null,
        errors: [
          {
            field: "user",
            message: "Authenticated user not found in database.",
          },
        ],
      });
    }

    // Compare current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      existingUser.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      return sendApiResponse(c, {
        status: 400, // Changed from 400 to 401 or 403 could be an option, but 400 for bad input is okay
        message: "Current password is incorrect.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "currentPassword",
            message: "Current password is incorrect.",
          },
        ],
      });
    }
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    // Update password
    await db.user.update({
      where: { id: authUser.id },
      data: { passwordHash: newPasswordHash, updatedAt: new Date() },
    });

    // Generate new JWT as a convenience, though frontend might not always need it immediately
    const payload: JwtPayload = {
      userId: authUser.id,
      email: existingUser.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = generateToken(payload); // Uses default expiry

    return sendApiResponse(c, {
      status: 200,
      message: "Password reset successful.",
      data: {
        token, // Sending back a new token can be useful
        user: { id: existingUser.id, email: existingUser.email },
      },
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
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
            "An unexpected error occurred during password reset.",
        },
      ],
    });
  }
};

const seedUserData = async (userId: string) => {
  const defaultCollections = ["Unsorted"];
  const defaultTags = ["Read Later", "Important", "Favorites"];

  try {
    const createCollectionsPromises = defaultCollections.map((name) =>
      db.collection.create({
        data: {
          name: name,
          userId: userId,
          isSystem: true,
        },
      }),
    );

    const createTagsPromises = defaultTags.map((name) =>
      db.tag.create({
        data: { name, userId },
      }),
    );

    await Promise.all([...createCollectionsPromises, ...createTagsPromises]);
  } catch (error) {
    console.error(`Error seeding user data for ${userId}:`, error);
  }
};

export const forgotPassword = async (c: Context) => {
  try {
    const { email } = (await c.req.json()) as { email?: string };

    if (!email) {
      return sendApiResponse(c, {
        status: 400,
        message: "Email is required.",
        data: null,
        metadata: null,
        errors: [{ field: "email", message: "Email is required." }],
      });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return sendApiResponse(c, {
        status: 200,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        data: null,
        metadata: null,
        errors: null,
      });
    }

    const expiryInSeconds = Math.floor(Date.now() / 1000) + 3600;

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      exp: expiryInSeconds,
    };

    const resetToken = generateToken(payload, expiryInSeconds);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(expiryInSeconds * 1000),
        updatedAt: new Date(),
      },
    });

    await sendForgotPasswordEmail(
      user.email,
      user.name ?? user.email,
      resetToken,
    );

    return sendApiResponse(c, {
      status: 200,
      message:
        "If an account with that email exists, a password reset link has been sent.",
      data: null,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "An unexpected error occurred.",
        },
      ],
    });
  }
};

// Validate Reset Token Endpoint
export const validateResetToken = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return sendApiResponse(c, {
        status: 400,
        message: "Reset token is required.",
        data: { valid: false },
        metadata: null,
        errors: [{ field: "token", message: "Reset token is required." }],
      });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return sendApiResponse(c, {
        status: 400,
        message: "Invalid or expired reset token.",
        data: { valid: false },
        metadata: null,
        errors: [
          {
            field: "token",
            message: "The provided reset token is invalid or has expired.",
          },
        ],
      });
    }

    // Check if user exists, token matches, and DB expiry is valid
    const user = await db.user.findFirst({
      where: {
        email: decodedToken.email,
        resetToken: token,
      },
    });

    if (!user) {
      return sendApiResponse(c, {
        status: 400,
        message: "Invalid reset token.",
        data: { valid: false },
        metadata: null,
        errors: [
          {
            field: "token",
            message: "The provided reset token is invalid.",
          },
        ],
      });
    }

    if (
      !user.resetTokenExpiry ||
      user.resetTokenExpiry.getTime() < new Date().getTime()
    ) {
      return sendApiResponse(c, {
        status: 400,
        message: "Reset token has expired.",
        data: { valid: false },
        metadata: null,
        errors: [
          {
            field: "token",
            message: "The reset token is no longer valid or has expired.",
          },
        ],
      });
    }

    return sendApiResponse(c, {
      status: 200,
      message: "Reset token is valid.",
      data: {
        valid: true,
        email: user.email,
      },
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Validate Reset Token Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: { valid: false },
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "An unexpected error occurred.",
        },
      ],
    });
  }
};

export const resetPasswordWithToken = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { token, newPassword, confirmPassword } = body as {
      token?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!token) {
      return sendApiResponse(c, {
        status: 400,
        message: "Reset token is required.",
        data: null,
        metadata: null,
        errors: [{ field: "token", message: "Reset token is required." }],
      });
    }

    if (!newPassword || !confirmPassword) {
      const errors = [];
      if (!newPassword)
        errors.push({
          field: "newPassword",
          message: "New password is required.",
        });
      if (!confirmPassword)
        errors.push({
          field: "confirmPassword",
          message: "Confirm password is required.",
        });
      return sendApiResponse(c, {
        status: 400,
        message: "Password fields are required.",
        data: null,
        metadata: null,
        errors,
      });
    }

    if (newPassword !== confirmPassword) {
      return sendApiResponse(c, {
        status: 400,
        message: "Passwords do not match.",
        data: null,
        metadata: null,
        errors: [
          { field: "confirmPassword", message: "Passwords do not match." },
        ],
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return sendApiResponse(c, {
        status: 400,
        message: "Password does not meet security requirements.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "newPassword",
            message:
              "Password must be at least 8 characters and include uppercase, lowercase, number, and a special character.",
          },
        ],
      });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return sendApiResponse(c, {
        status: 400,
        message: "Invalid or expired reset token.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "token",
            message: "The provided reset token is invalid or has expired.",
          },
        ],
      });
    }

    const user = await db.user.findUnique({
      where: {
        id: decodedToken.userId,
        resetToken: token,
      },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return sendApiResponse(c, {
        status: 400,
        message: "Invalid or expired reset token.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "token",
            message: "The reset token is no longer valid or has expired.",
          },
        ],
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      },
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Password has been reset successfully.",
      data: {
        message:
          "Your password has been updated. You can now log in with your new password.",
      },
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Reset Password with Token Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "An unexpected error occurred.",
        },
      ],
    });
  }
};

export const authincateByAccessCode = async (c: Context) => {
  try {
    const { email } = (await c.req.json()) as { email?: string };

    if (!email) {
      return sendApiResponse(c, {
        status: 400,
        message: "Email is required.",
        data: null,
        metadata: null,
        errors: [{ field: "email", message: "Email is required." }],
      });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return sendApiResponse(c, {
        status: 200,
        message: "If an account with that email exists, an access code has been sent.",
        data: null,
        metadata: null,
        errors: null,
      });
    }

    const accessCode = generateAccessCode(6);

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        accessToken: accessCode,
        resetTokenExpiry: expiryTime,
        updatedAt: new Date(),
      },
    });

    await sendAccessCode(
      user.email,
      user.name ?? user.email,
      accessCode
    );

    return sendApiResponse(c, {
      status: 200,
      message: "If an account with that email exists, an access code has been sent.",
      data: null,
      metadata: null,
      errors: null,
    });

  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "An unexpected error occurred.",
        },
      ],
    });
  }
};

export const verifyAccessCode = async (c: Context) => {
  try {
    const { email, accessCode } = (await c.req.json()) as {
      email?: string;
      accessCode?: string;
    };
    if (!email || !accessCode) {
      return sendApiResponse(c, {
        status: 400,
        message: "Email and access code are required.",
        data: null,
        metadata: null,
        errors: [
          ...((!email) ? [{ field: "email", message: "Email is required." }] : []),
          ...((!accessCode) ? [{ field: "accessCode", message: "Access code is required." }] : [])
        ],
      });
    }
    const user = await db.user.findUnique({ where: { email } });
    if (!user ||
      !user.accessToken ||
      user.accessToken.toUpperCase() !== accessCode.toUpperCase() ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < new Date()) {
      return sendApiResponse(c, {
        status: 400,
        message: "Invalid or expired access code.",
        data: null,
        metadata: null,
        errors: [{ field: "accessCode", message: "Invalid or expired access code." }],
      });
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 604800,
    };
    const token = generateToken(payload);

    await db.user.update({
      where: { id: user.id },
      data: {
        accessToken: null,
        resetTokenExpiry: null,
      },
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Access code verified successfully.",
      data: {
        token,
        user: { id: user.id, email: user.email },
        verified: true,
      },
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Verify Access Code Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "An unexpected error occurred.",
        },
      ],
    });
  }
};
