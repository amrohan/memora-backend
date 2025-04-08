import { Context } from "hono";
import db from "../db";
import { fetchMetadata } from "../lib/metadataFetcher";
import { getAuthUser } from "../lib/authUtils";
import { sendApiResponse } from "../lib/responseUtils";

export const addBookmark = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const { url } = await c.req.json();

    // Basic Validation
    if (!url || typeof url !== "string") {
      return sendApiResponse(c, {
        status: 400,
        message: "Bad Request",
        data: null,
        metadata: null,
        errors: [
          {
            field: "url",
            message: "URL is required and must be a valid string.",
          },
        ],
      });
    }
    // Add more robust URL validation if needed

    // Check if bookmark already exists for this user
    const existingBookmark = await db.bookmark.findUnique({
      where: { userId_url: { userId: user.id, url: url } },
    });
    if (existingBookmark) {
      return sendApiResponse(c, {
        status: 409,
        message: "Conflict",
        data: null,
        metadata: null,
        errors: [
          {
            field: "url",
            message: "Bookmark with this URL already exists.",
          },
        ],
      });
    }

    // Fetch metadata (title, description, image)
    const metadata = await fetchMetadata(url);

    // Create bookmark
    const newBookmark = await db.bookmark.create({
      data: {
        url: url,
        title: metadata.title || url.substring(0, 100), // Use part of URL as fallback title
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        userId: user.id,
        // Tags and Collections handled in update/edit step
      },
      // Include related data if needed immediately (optional)
      // include: { tags: true, collections: true },
    });

    // Return the newly created bookmark
    // You might redirect to an edit page or just return the data
    return sendApiResponse(c, {
      status: 201,
      message: "Bookmark added successfully.",
      data: newBookmark,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Add Bookmark Error:", error);
    // Handle potential Prisma unique constraint errors more gracefully if needed
    if (error.code === "P2002") {
      // Prisma unique constraint violation code
      return sendApiResponse(c, {
        status: 409,
        message: "Conflict",
        data: null,
        metadata: null,
        errors: [
          {
            field: "url",
            message: "Bookmark with this URL already exists.",
          },
        ],
      });
    }
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
            "Failed to create bookmark. Please try again later.",
        },
      ],
    });
  }
};

// --- Get Bookmark Details Handler ---
export const getBookmark = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param(); // Get bookmark ID from URL path

  try {
    const bookmark = await db.bookmark.findUnique({
      where: {
        id: id,
        userId: user.id, // Ensure the user owns this bookmark
      },
      include: {
        // Include related tags and collections
        tags: { select: { id: true, name: true } },
        collections: { select: { id: true, name: true } },
      },
    });

    if (!bookmark) {
      return sendApiResponse(c, {
        status: 404,
        message: "Bookmark not found or you do not have permission.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "bookmark",
            message: "Bookmark not found or you do not have permission.",
          },
        ],
      });
    }

    return sendApiResponse(c, {
      status: 200,
      message: "Bookmark retrieved successfully.",
      data: bookmark,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Get Bookmark Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message:
            error.message || "Failed to retrieve bookmark. Please try again.",
        },
      ],
    });
  }
};

// --- Update Bookmark Handler ---
export const updateBookmark = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param(); // Get bookmark ID from URL path

  try {
    const { title, description, imageUrl, tags, collectionIds } =
      await c.req.json();
    // tags should be an array of tag *names* (strings)
    // collectionIds should be an array of collection *IDs* (strings)

    // Validate input types (basic example)
    if (tags && !Array.isArray(tags)) {
      return sendApiResponse(c, {
        status: 400,
        message: "Bad Request",
        data: null,
        metadata: null,
        errors: [
          {
            field: "tags",
            message: "Tags must be an array of strings.",
          },
        ],
      });
    }

    if (collectionIds && !Array.isArray(collectionIds)) {
      return sendApiResponse(c, {
        status: 400,
        message: "Bad Request",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collectionIds",
            message: "Collection IDs must be an array of strings.",
          },
        ],
      });
    }

    // 1. Find the bookmark to ensure it exists and belongs to the user
    const existingBookmark = await db.bookmark.findUnique({
      where: { id: id, userId: user.id },
    });

    if (!existingBookmark) {
      return sendApiResponse(c, {
        status: 404,
        message: "Bookmark not found or you do not have permission.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "bookmark",
            message: "Bookmark not found or you do not have permission.",
          },
        ],
      });
    }

    // 2. Handle Tags: Find existing or create new tags based on names provided
    const tagConnectOrCreateOps = tags
      ? tags.map((tagName: string) => ({
          where: { name: tagName.trim().toLowerCase() }, // Normalize tag name
          create: { name: tagName.trim().toLowerCase() },
        }))
      : [];

    // 3. Handle Collections: Ensure collections exist and belong to the user (important!)
    let validCollectionIds: string[] = [];
    if (collectionIds && collectionIds.length > 0) {
      const userCollections = await db.collection.findMany({
        where: {
          id: { in: collectionIds },
          userId: user.id, // Security check!
        },
        select: { id: true },
      });
      validCollectionIds = userCollections.map((col) => col.id);
      // Optionally warn if some provided collectionIds were invalid/not owned
    }
    const collectionConnectOps = validCollectionIds.map((colId) => ({
      id: colId,
    }));

    // 4. Update the bookmark with new data and relations
    const updatedBookmark = await db.bookmark.update({
      where: {
        id: id,
        // Redundant check, but good practice: userId: user.id,
      },
      data: {
        title: title ?? existingBookmark.title, // Use ?? to keep existing if not provided
        description: description ?? existingBookmark.description,
        imageUrl: imageUrl ?? existingBookmark.imageUrl,
        tags: {
          // Disconnect all existing tags and connect the new/updated set
          set:
            tagConnectOrCreateOps.length > 0
              ? tagConnectOrCreateOps.map((op: any) => ({
                  name: op.create.name,
                }))
              : [],
          // More granular connect/disconnect is possible but more complex
          // connectOrCreate: tagConnectOrCreateOps, // Requires tag names to be unique
        },
        collections: {
          // Disconnect all existing collections and connect the new/updated set
          set: collectionConnectOps,
        },
      },
      include: {
        // Return updated bookmark with relations
        tags: { select: { id: true, name: true } },
        collections: { select: { id: true, name: true } },
      },
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Bookmark updated successfully.",
      data: updatedBookmark,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Update Bookmark Error:", error);
    // Handle potential Prisma errors
    if (error.code === "P2025") {
      // Record to update not found (might happen if ID is wrong)
      return sendApiResponse(c, {
        status: 404,
        message: "Bookmark not found.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "bookmark",
            message: "Bookmark not found.",
          },
        ],
      });
    }
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message:
            error.message || "Failed to update bookmark. Please try again.",
        },
      ],
    });
  }
};

// --- Delete Bookmark Handler ---
export const deleteBookmark = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param(); // Get bookmark ID from URL path

  try {
    // Use deleteMany to ensure we only delete if the userId matches
    const deleteResult = await db.bookmark.deleteMany({
      where: {
        id: id,
        userId: user.id, // Crucial security check
      },
    });

    // deleteMany returns a count. If count is 0, the bookmark wasn't found or didn't belong to the user.
    if (deleteResult.count === 0) {
      return sendApiResponse(c, {
        status: 404,
        message: "Bookmark not found or you do not have permission.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "bookmark",
            message: "Bookmark not found or you do not have permission.",
          },
        ],
      });
    }

    return sendApiResponse(c, {
      status: 204,
      message: "Bookmark deleted successfully.",
      data: null,
      metadata: null,
      errors: null,
    });

    // return c.body(null, 204)
  } catch (error: any) {
    console.error("Delete Bookmark Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message:
            error.message || "Failed to delete bookmark. Please try again.",
        },
      ],
    });
  }
};

// --- List Bookmarks Handler (Dashboard) ---
export const listBookmarks = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  // Optional query parameters for filtering/pagination (add later if needed)
  // const { tag, collection, page, limit } = c.req.query();

  try {
    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: user.id,
        // Add filtering based on query params here if implementing
        // Example: tags: tag ? { some: { name: tag } } : undefined,
      },
      include: {
        tags: { select: { id: true, name: true } },
        collections: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: "desc", // Show newest first
      },
      // Add pagination logic here if implementing (skip, take)
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Bookmarks retrieved successfully.",
      data: bookmarks,
      metadata: {
        totalCount: bookmarks.length,
      },
      errors: null,
    });
  } catch (error: any) {
    sendApiResponse(c, {
      status: 500,
      message: "Internal Server Error",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "Failed to retrieve bookmarks.",
        },
      ],
    });
  }
};
