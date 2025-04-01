// src/handlers/tagHandler.ts (Updated)

import { Context } from "hono";
import db from "../db"; // Import the Prisma client instance [cite: uploaded:src/db.ts]
import { AuthUser } from "../types"; // Need this for user-specific tags [cite: uploaded:src/types/index.ts]
import { getAuthUser } from "../lib/authUtils";

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
    return c.json(tags);
  } catch (error: any) {
    console.error("List All Tags Error:", error);
    return c.json(
      { error: "Internal Server Error", message: "Failed to retrieve tags." },
      500
    );
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
    return c.json(
      {
        error: "Unauthorized",
        message: "Authentication required to view your tags.",
      },
      401
    );
  }

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

    return c.json(userTags);
  } catch (error: any) {
    console.error(`List User Tags Error for user ${user.id}:`, error);
    return c.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve your tags.",
      },
      500
    );
  }
};
export const getTagByTagId = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Authentication required to view this tag.",
      },
      401
    );
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
      return c.json(
        { error: "Not Found", message: "Tag not found or not accessible." },
        404
      );
    }

    return c.json(tag);
  } catch (error: any) {
    console.error(`Get Tag Error for user ${user.id}:`, error);
    return c.json(
      { error: "Internal Server Error", message: "Failed to retrieve tag." },
      500
    );
  }
};

export const createTag = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Authentication required to create a tag.",
      },
      401
    );
  }

  try {
    const { name } = await c.req.json();
    if (!name) {
      return c.json(
        { error: "Bad Request", message: "Tag name is required." },
        400
      );
    }

    // Check if the tag already exists
    const existingTag = await db.tag.findUnique({
      where: { name: name },
    });

    if (existingTag) {
      return c.json({ error: "Conflict", message: "Tag already exists." }, 409);
    }

    // Create the new tag
    const newTag = await db.tag.create({
      data: {
        name,
        bookmarks: {
          connect: [], // No bookmarks connected initially
        },
      },
    });

    return c.json(newTag, 201);
  } catch (error: any) {
    console.error(`Create Tag Error for user ${user.id}:`, error);
    return c.json(
      { error: "Internal Server Error", message: "Failed to create tag." },
      500
    );
  }
};
export const updateTag = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Authentication required to update a tag.",
      },
      401
    );
  }
  const { id } = c.req.param();
  try {
    const { name } = await c.req.json();
    if (!name) {
      return c.json(
        { error: "Bad Request", message: "Tag name is required." },
        400
      );
    }

    // Update the tag
    const updatedTag = await db.tag.update({
      where: { id: id },
      data: { name: name },
    });

    return c.json(updatedTag);
  } catch (error: any) {
    console.error(`Update Tag Error for user ${user.id}:`, error);
    return c.json(
      { error: "Internal Server Error", message: "Failed to update tag." },
      500
    );
  }
};

export const deleteTag = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Authentication required to delete a tag.",
      },
      401
    );
  }
  const { id } = c.req.param();
  try {
    await db.tag.delete({
      where: { id: id },
    });

    return c.json({ message: "Tag deleted successfully." });
  } catch (error: any) {
    console.error(`Delete Tag Error for user ${user.id}:`, error);
    return c.json(
      { error: "Internal Server Error", message: "Failed to delete tag." },
      500
    );
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
          bookmarks: {
            connect: [],
          },
        })),
      });
    }
  } catch (error) {
    console.error("Error creating default tags:", error);
  }
};
