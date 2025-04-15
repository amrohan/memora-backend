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

    const metadata = await fetchMetadata(url);

    const newBookmark = await db.bookmark.create({
      data: {
        url: url,
        title: metadata.title || url.substring(0, 100),
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        userId: user.id,
      },

      include: { tags: true, collections: true },
    });

    return sendApiResponse(c, {
      status: 201,
      message: "Bookmark added successfully.",
      data: newBookmark,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Add Bookmark Error:", error);

    if (error.code === "P2002") {
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

export const getBookmark = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();

  try {
    const bookmark = await db.bookmark.findUnique({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
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

export const updateBookmark = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();

  try {
    const { title, description, imageUrl, tags, collections } =
      await c.req.json();

    if (tags && !Array.isArray(tags)) {
      return sendApiResponse(c, {
        status: 400,
        message: "Bad Request",
        data: null,
        metadata: null,
        errors: [
          {
            field: "tags",
            message: "Tags must be an array of Tags.",
          },
        ],
      });
    }

    if (collections && !Array.isArray(collections)) {
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

    const tagConnectOrCreateOps = tags
      ? tags.map((tagName: { id: string; name: string }) => ({
          where: { name: tagName.name.trim().toLowerCase() },
          create: { name: tagName.name.trim().toLowerCase() },
        }))
      : [];

    let validCollectionIds: string[] = [];
    if (collections && collections.length > 0) {
      const userCollections = await db.collection.findMany({
        where: {
          id: { in: collections.map((col: { id: string }) => col.id) },
          userId: user.id,
        },
        select: { id: true },
      });
      validCollectionIds = userCollections.map((col) => col.id);
    }
    const collectionConnectOps = validCollectionIds.map((colId) => ({
      id: colId,
    }));

    const updatedBookmark = await db.bookmark.update({
      where: {
        id: id,
      },
      data: {
        title: title ?? existingBookmark.title,
        description: description ?? existingBookmark.description,
        imageUrl: imageUrl ?? existingBookmark.imageUrl,
        tags: {
          set:
            tagConnectOrCreateOps.length > 0
              ? tagConnectOrCreateOps.map((op: any) => ({
                  name: op.create.name,
                }))
              : [],
        },
        collections: {
          set: collectionConnectOps,
        },
      },
      include: {
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

    if (error.code === "P2025") {
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

export const deleteBookmark = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();

  try {
    const deleteResult = await db.bookmark.deleteMany({
      where: {
        id: id,
        userId: user.id,
      },
    });

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

export const listBookmarks = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: user.id,
      },
      include: {
        tags: { select: { id: true, name: true } },
        collections: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
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
