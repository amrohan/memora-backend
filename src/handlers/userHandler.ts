import { Context } from "hono";
import db from "../db";
import { getAuthUser } from "../lib/authUtils";
import { sendApiResponse } from "../lib/responseUtils";

export const userInformation = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Unauthorized",
      data: null,
      metadata: null,
      errors: [
        {
          field: "user",
          message: "Unauthorized",
        },
      ],
    });
  }

  try {
    const userInfo = await db.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userInfo) {
      return sendApiResponse(c, {
        status: 404,
        message: "User not found.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "user",
            message: "User not found.",
          },
        ],
      });
    }

    return sendApiResponse(c, {
      status: 200,
      message: "User information retrieved successfully.",
      data: userInfo,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Get User Information Error:", error);
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
            "Failed to retrieve user information. Please try again.",
        },
      ],
    });
  }
};
