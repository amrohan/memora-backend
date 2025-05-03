import { Context } from "hono";
import db from "../db";
import { fetchMetadata } from "../lib/metadataFetcher";
import { getAuthUser } from "../lib/authUtils";
import { sendApiResponse } from "../lib/responseUtils";
import { Prisma } from "../../generated/prisma";

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

    // Find the most recently created bookmark by the user
    const recentBookmark = await db.bookmark.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        collections: true,
        tags: true,
      },
    });

    const defaultCollection = recentBookmark?.collections?.[0];
    const defaultTag = recentBookmark?.tags?.[0];

    const newBookmark = await db.bookmark.create({
      data: {
        url: url,
        title: metadata.title || url.substring(0, 100),
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        userId: user.id,
        collections: defaultCollection
          ? {
            connect: {
              id: defaultCollection.id,
            },
          }
          : undefined,
        tags: defaultTag
          ? {
            connect: {
              id: defaultTag.id,
            },
          }
          : undefined,
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
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to view bookmarks.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

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
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to view bookmarks.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  const { id } = c.req.param();

  try {
    const { title, description, imageUrl, tags, collections } =
      await c.req.json();

    // Validate tags format
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

    // Validate collections format
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

    // Check if bookmark exists and belongs to the user
    const existingBookmark = await db.bookmark.findUnique({
      where: { id: id, userId: user.id },
      include: {
        tags: true,
        collections: true,
      },
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

    // Process collections - validate they belong to the user
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

    // Prepare update data
    const updateData: any = {
      title: title ?? existingBookmark.title,
      description: description ?? existingBookmark.description,
      imageUrl: imageUrl ?? existingBookmark.imageUrl,
    };

    // Handle collections update
    if (collections !== undefined) {
      updateData.collections = {
        set: validCollectionIds.map((id) => ({ id })),
      };
    }

    // Handle tags update - Fixed approach
    if (tags !== undefined) {
      // First disconnect all existing tags
      updateData.tags = {
        disconnect: existingBookmark.tags.map((tag) => ({ id: tag.id })),
      };

      // Process and connect new tags
      const tagPromises = tags.map(
        async (tag: { id?: string; name: string }) => {
          const tagName = tag.name.trim().toLowerCase();

          // If tag has an ID, try to connect to it first
          if (tag.id) {
            const existingTag = await db.tag.findUnique({
              where: { id: tag.id },
            });

            if (existingTag) {
              return { id: existingTag.id };
            }
          }

          // Otherwise look up by name or create new
          const existingTag = await db.tag.findFirst({
            where: { name: tagName, userId: user.id },
          });

          if (existingTag) {
            return { id: existingTag.id };
          } else {
            const newTag = await db.tag.create({
              data: {
                name: tagName,
                userId: user.id,
              },
            });
            return { id: newTag.id };
          }
        }
      );

      const tagConnections = await Promise.all(tagPromises);

      // Update the tags connect operation
      updateData.tags = {
        ...updateData.tags,
        connect: tagConnections,
      };
    }

    // Update the bookmark
    const updatedBookmark = await db.bookmark.update({
      where: {
        id: id,
      },
      data: updateData,
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
      status: 200,
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
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to view bookmarks.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  try {
    // 1. Get query parameters
    const { page, pageSize, search, collectionId, tagId } = c.req.query();
    const pageNumber = parseInt(page as string) || 1;
    const pageSizeNumber = parseInt(pageSize as string) || 10;

    // 2. Process parameters, explicitly handling "undefined" strings and empty strings
    const searchQuery =
      search && typeof search === "string" && search.trim() !== ""
        ? search.trim()
        : null;

    const rawCollectionId = collectionId as string | undefined;
    const filterCollectionId =
      rawCollectionId &&
        rawCollectionId.trim() !== "" &&
        rawCollectionId.toLowerCase() !== "undefined"
        ? rawCollectionId.trim()
        : null;

    const rawTagId = tagId as string | undefined;
    const filterTagId =
      rawTagId &&
        rawTagId.trim() !== "" &&
        rawTagId.toLowerCase() !== "undefined"
        ? rawTagId.trim()
        : null;

    // 3. Define the base WHERE clause filtering by user
    let finalWhereClause: Prisma.BookmarkWhereInput = {
      userId: user.id,
    };

    // 4. Apply search filter (if provided and valid)
    if (searchQuery) {
      // NOTE: Using case-sensitive search. Update Prisma and uncomment 'mode'
      // for case-insensitive search.
      finalWhereClause.OR = [
        { title: { contains: searchQuery /*, mode: "insensitive" */ } },
        { url: { contains: searchQuery /*, mode: "insensitive" */ } },
        { description: { contains: searchQuery /*, mode: "insensitive" */ } },
      ];
    }

    // 5. Apply collection filter (if provided and valid)
    if (filterCollectionId) {
      finalWhereClause.collections = {
        some: {
          id: filterCollectionId,
        },
      };
    }

    // 6. Apply tag filter (if provided and valid)
    if (filterTagId) {
      finalWhereClause.tags = {
        some: {
          id: filterTagId,
        },
      };
    }

    // 7. Get the TOTAL count of matching bookmarks
    const totalCount = await db.bookmark.count({
      where: finalWhereClause,
    });

    // 8. Prepare metadata
    const totalPages = Math.ceil(totalCount / pageSizeNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    const nextPage = hasNextPage ? pageNumber + 1 : null;
    const previousPage = hasPreviousPage ? pageNumber - 1 : null;

    // 9. Handle case where no bookmarks match the filters
    if (totalCount === 0) {
      let message = "No bookmarks found for this user.";
      // Check if any *valid* filters were actually applied
      if (searchQuery || filterCollectionId || filterTagId) {
        message = "No bookmarks found matching your filter criteria.";
        // More specific messages based on *valid* filters applied
        if (searchQuery && !filterCollectionId && !filterTagId) {
          message = "No bookmarks found matching your search (case-sensitive).";
        } else if (filterCollectionId && !searchQuery && !filterTagId) {
          message = `No bookmarks found in the specified collection.`; // Avoid showing the ID unless necessary
        } else if (filterTagId && !searchQuery && !filterCollectionId) {
          message = `No bookmarks found with the specified tag.`; // Avoid showing the ID unless necessary
        }
      }

      return sendApiResponse(c, {
        status: 200,
        message: message,
        data: [],
        metadata: {
          totalCount: 0,
          page: pageNumber,
          pageSize: pageSizeNumber,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
        },
        errors: null,
      });
    }

    // 10. Fetch the bookmarks for the CURRENT page
    const bookmarks = await db.bookmark.findMany({
      where: finalWhereClause,
      include: {
        tags: { select: { id: true, name: true } },
        collections: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (pageNumber - 1) * pageSizeNumber,
      take: pageSizeNumber,
    });

    // 11. Return the successful response
    return sendApiResponse(c, {
      status: 200,
      message: "Bookmarks retrieved successfully.",
      data: bookmarks,
      metadata: {
        totalCount: totalCount,
        page: pageNumber,
        pageSize: pageSizeNumber,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage,
        nextPage: nextPage,
        previousPage: previousPage,
      },
      errors: null,
    });
  } catch (error: any) {
    console.error(
      `List Bookmarks Error for user ${user?.id || "unauthenticated"}:`,
      error
    );
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("Prisma Validation Error:", error.message);
      return sendApiResponse(c, {
        status: 400,
        message: "Invalid query parameters or filter.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "query",
            message:
              "There was an issue with the filter criteria. Check ID formats.",
          },
        ],
      });
    }
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve bookmarks.",
      data: null,
      metadata: null,
      errors: [
        { field: "server", message: error.message || "Internal Server Error" },
      ],
    });
  }
};

export const getTotalBookmarksCount = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to view bookmarks.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  try {
    const bookmarksCount = await db.bookmark.count({
      where: {
        userId: user.id,
      },
    });
    const tagsCount = await db.tag.count({
      where: {
        bookmarks: {
          some: {
            userId: user.id,
          },
        },
      },
    });
    const collectionsCount = await db.collection.count({
      where: {
        userId: user.id,
      },
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Total bookmarks count retrieved successfully.",
      data: { bookmarksCount, tagsCount, collectionsCount },
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Get Total Bookmarks Count Error:", error);
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
            "Failed to retrieve bookmarks count. Please try again.",
        },
      ],
    });
  }
};

export const getRecentBookmarks = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to view bookmarks.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  try {
    const recentBookmarks = await db.bookmark.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Recent bookmarks retrieved successfully.",
      data: recentBookmarks,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Get Recent Bookmarks Error:", error);
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
            "Failed to retrieve recent bookmarks. Please try again.",
        },
      ],
    });
  }
};
