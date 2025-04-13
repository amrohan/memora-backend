import { Context } from "hono";
import db from "../db"; // Import the Prisma client instance [cite: uploaded:src/db.ts]
import { AuthUser } from "../types"; // Need this for user-specific tags [cite: uploaded:src/types/index.ts]
import { getAuthUser } from "../lib/authUtils";
import { sendApiResponse } from "../lib/responseUtils";

/**
 * Handles the retrieval of all unique tags stored in the database globally.
 * @param c Hono context object
 * @returns JSON response with a list of all tags or an error object.
 */
export const listAllTags = async (c: Context) => {
  // No authentication needed usually for listing all possible tags

  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        // Optionally include count of *all* bookmarks later
        // _count: { select: { bookmarks: true } }
      },
    });
    return sendApiResponse(c, {
      status: 200,
      message: "Tags retrieved successfully.",
      data: tags,
      errors: null,
      metadata: null,
    });
  } catch (error: any) {
    console.error("List All Tags Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve tags.",
      data: null,
      errors: [{ field: "database", message: error.message }], // Example error handling
      metadata: null,
    });
  }
};

/**
 * Retrieves a list of unique tags that are associated with any bookmark
 * belonging to the currently authenticated user.
 * Requires authentication.
 * @param c Hono context object
 * @returns JSON response with a list of user-specific tags or an error object.
 */
export const listUserTags = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to view your tags.",
      data: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
      metadata: null,
    });
  }
  // If user is authenticated, proceed to fetch their tags
  try {
    // Find all unique tags linked to bookmarks owned by the user
    const userTags = await db.tag.findMany({
      where: {
        // Filter tags where 'bookmarks' relation has 'some' entry...
        bookmarks: {
          some: {
            // ...that belongs to the current user
            userId: user.id,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        // Select only the necessary fields
        id: true,
        name: true,
        // Optionally include count of *user's* bookmarks with this tag later
        // _count: { select: { bookmarks: { where: { userId: user.id } } } }
      },
    });

    return sendApiResponse(c, {
      status: 200,
      message: "User tags retrieved successfully.",
      data: userTags,
      errors: null,
      metadata: null,
    });
  } catch (error: any) {
    console.error(`List User Tags Error for user ${user.id}:`, error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve user tags.",
      data: null,
      errors: [{ field: "database", message: error.message }],
      metadata: null,
    });
  }
};
export const getTagByTagId = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to view this tag.",
      data: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
      metadata: null,
    });
  }
  const { id } = c.req.param();
  try {
    const tag = await db.tag.findUnique({
      where: {
        id: id,
        // Ensure the tag is linked to at least one bookmark of the user
        bookmarks: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        bookmarks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!tag) {
      return sendApiResponse(c, {
        status: 404,
        message: "Tag not found.",
        data: null,
        errors: [{ field: "tag", message: "Tag not found or not accessible." }],
        metadata: null,
      });
    }

    return sendApiResponse(c, {
      status: 200,
      message: "Tag retrieved successfully.",
      data: tag,
      errors: null,
      metadata: null,
    });
  } catch (error: any) {
    console.error(`Get Tag Error for user ${user.id}:`, error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve tag.",
      data: null,
      errors: [{ field: "database", message: error.message }],
      metadata: null,
    });
  }
};

export const createTag = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to create a tag.",
      data: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
      metadata: null,
    });
  }

  try {
    const { name } = await c.req.json();
    if (!name) {
      return sendApiResponse(c, {
        status: 400,
        message: "Tag name is required.",
        data: null,
        errors: [{ field: "name", message: "Tag name is required." }],
        metadata: null,
      });
    }

    // Check if the user already has a tag with the same name
    const existingTag = await db.tag.findFirst({
      where: {
        name: name,
        bookmarks: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (existingTag) {
      return sendApiResponse(c, {
        status: 409,
        message: "Tag already exists.",
        data: null,
        errors: [{ field: "name", message: "Tag already exists." }],
        metadata: null,
      });
    }

    // Create the new tag
    const newTag = await db.tag.create({
      data: {
        name,
        user: {
          connect: { id: user.id },
        },
        bookmarks: {
          connect: [],
        },
      },
    });
    return sendApiResponse(c, {
      status: 201,
      message: "Tag created successfully.",
      data: newTag,
      errors: null,
      metadata: null,
    });
  } catch (error: any) {
    console.error(`Create Tag Error for user ${user.id}:`, error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to create tag.",
      data: null,
      errors: [{ field: "database", message: error.message }],
      metadata: null,
    });
  }
};
export const updateTag = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to update a tag.",
      data: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
      metadata: null,
    });
  }
  const { id } = c.req.param();
  try {
    const { name } = await c.req.json();
    if (!name) {
      return sendApiResponse(c, {
        status: 400,
        message: "Tag name is required.",
        data: null,
        errors: [{ field: "name", message: "Tag name is required." }],
        metadata: null,
      });
    }

    // Update the tag
    const updatedTag = await db.tag.update({
      where: { id: id },
      data: { name: name },
    });
    return sendApiResponse(c, {
      status: 200,
      message: "Tag updated successfully.",
      data: updatedTag,
      errors: null,
      metadata: null,
    });
  } catch (error: any) {
    console.error(`Update Tag Error for user ${user.id}:`, error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to update tag.",
      data: null,
      errors: [{ field: "database", message: error.message }],
      metadata: null,
    });
  }
};

export const deleteTag = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to delete a tag.",
      data: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
      metadata: null,
    });
  }
  const { id } = c.req.param();
  try {
    await db.tag.delete({
      where: { id: id },
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Tag deleted successfully.",
      data: null,
      errors: null,
      metadata: null,
    });
  } catch (error: any) {
    console.error(`Delete Tag Error for user ${user.id}:`, error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to delete tag.",
      data: null,
      errors: [{ field: "database", message: error.message }],
      metadata: null,
    });
  }
};

export const createDefaultTags = async (user: AuthUser) => {
  const defaultTags = [
    "Work",
    "Personal",
    "Reading",
    "Travel",
    "Food",
    "Tech",
    "Finance",
  ];
  try {
    const existingTags = await db.tag.findMany({
      where: {
        bookmarks: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        name: true,
      },
    });

    const existingTagNames = new Set(existingTags.map((tag) => tag.name));

    const tagsToCreate = defaultTags.filter(
      (tag) => !existingTagNames.has(tag)
    );

    if (tagsToCreate.length > 0) {
      await db.tag.createMany({
        data: tagsToCreate.map((tag) => ({
          name: tag,
          userId: user.id,
        })),
      });
    }
  } catch (error) {
    console.error("Error creating default tags:", error);
  }
};
