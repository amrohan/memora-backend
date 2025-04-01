// src/handlers/collectionHandler.ts
import { Context } from "hono";
import db from "../db";
import { AuthUser } from "../types";
import { getAuthUser } from "../lib/authUtils";

// --- Create Collection Handler ---
export const createCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const { name } = await c.req.json();

    // Basic Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return c.json(
        { error: "Validation failed", message: "Collection name is required." },
        400
      );
    }

    // Check for duplicate collection name for this user
    const existingCollection = await db.collection.findUnique({
      where: { userId_name: { userId: user.id, name: name.trim() } },
    });
    if (existingCollection) {
      return c.json(
        {
          error: "Conflict",
          message: "A collection with this name already exists.",
        },
        409
      );
    }

    // Create collection
    const newCollection = await db.collection.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
    });

    return c.json(
      {
        message: "Collection created successfully.",
        collection: newCollection,
      },
      201
    );
  } catch (error: any) {
    console.error("Create Collection Error:", error);
    if (error.code === "P2002") {
      // Prisma unique constraint violation
      return c.json(
        {
          error: "Conflict",
          message: "A collection with this name likely already exists.",
        },
        409
      );
    }
    return c.json(
      {
        error: "Internal Server Error",
        message: error.message || "Failed to create collection.",
      },
      500
    );
  }
};

// --- List Collections Handler ---
export const listCollections = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const collections = await db.collection.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" }, // Order alphabetically
      // Optionally include bookmark count or some bookmarks later
      // include: { _count: { select: { bookmarks: true } } }
    });
    return c.json(collections);
  } catch (error: any) {
    console.error("List Collections Error:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve collections.",
      },
      500
    );
  }
};

// --- Get Collection Details Handler ---
export const getCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();

  try {
    const collection = await db.collection.findUnique({
      where: {
        id: id,
        userId: user.id, // Ensure user owns the collection
      },
      include: {
        // Optionally include bookmarks in this collection
        bookmarks: {
          orderBy: { createdAt: "desc" },
          include: { tags: { select: { id: true, name: true } } }, // Include tags for bookmarks
        },
      },
    });

    if (!collection) {
      return c.json(
        {
          error: "Not Found",
          message: "Collection not found or you do not have permission.",
        },
        404
      );
    }

    return c.json(collection);
  } catch (error: any) {
    console.error("Get Collection Error:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve collection details.",
      },
      500
    );
  }
};

// --- Update Collection Handler ---
export const updateCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();

  try {
    const { name } = await c.req.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return c.json(
        { error: "Validation failed", message: "Collection name is required." },
        400
      );
    }

    // Check if the new name conflicts with another collection for the same user
    const conflictingCollection = await db.collection.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        id: { not: id }, // Exclude the current collection being updated
      },
    });
    if (conflictingCollection) {
      return c.json(
        {
          error: "Conflict",
          message: "Another collection with this name already exists.",
        },
        409
      );
    }

    // Update the collection - Use updateMany to ensure ownership check
    const updateResult = await db.collection.updateMany({
      where: {
        id: id,
        userId: user.id, // Ensure user owns the collection before updating
      },
      data: {
        name: name.trim(),
        // updatedAt is handled automatically by Prisma @updatedAt
      },
    });

    if (updateResult.count === 0) {
      return c.json(
        {
          error: "Not Found",
          message:
            "Collection not found or you do not have permission to update it.",
        },
        404
      );
    }

    // Fetch the updated collection to return it
    const updatedCollection = await db.collection.findUnique({ where: { id } });

    return c.json({
      message: "Collection updated successfully.",
      collection: updatedCollection,
    });
  } catch (error: any) {
    console.error("Update Collection Error:", error);
    if (error.code === "P2002") {
      // Unique constraint potentially on name if check above failed somehow
      return c.json(
        {
          error: "Conflict",
          message: "A collection with this name may already exist.",
        },
        409
      );
    }
    if (error.code === "P2025") {
      // Record to update not found
      return c.json(
        { error: "Not Found", message: "Collection to update not found." },
        404
      );
    }
    return c.json(
      {
        error: "Internal Server Error",
        message: error.message || "Failed to update collection.",
      },
      500
    );
  }
};

// --- Delete Collection Handler ---
export const deleteCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();

  try {
    // Use deleteMany to ensure we only delete if the userId matches
    const deleteResult = await db.collection.deleteMany({
      where: {
        id: id,
        userId: user.id, // Crucial security check
      },
    });

    if (deleteResult.count === 0) {
      return c.json(
        {
          error: "Not Found",
          message:
            "Collection not found or you do not have permission to delete it.",
        },
        404
      );
    }

    return c.json({ message: "Collection deleted successfully." }, 200); // Or 204 No Content
    // return c.body(null, 204);
  } catch (error: any) {
    console.error("Delete Collection Error:", error);
    // Handle potential foreign key constraint issues if onDelete: Cascade isn't working as expected (though it should)
    return c.json(
      {
        error: "Internal Server Error",
        message: error.message || "Failed to delete collection.",
      },
      500
    );
  }
};
