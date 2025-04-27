import { Context } from "hono";
import db from "../db";
import { getAuthUser } from "../lib/authUtils";
import { sendApiResponse } from "../lib/responseUtils";
import { Prisma } from "../../generated/prisma";

// --- Create Collection Handler ---
export const createCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to create a collection.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  try {
    const { name } = await c.req.json();

    // Basic Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return sendApiResponse(c, {
        status: 400,
        message: "Collection name is required.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "name",
            message: "Collection name is required.",
          },
        ],
      });
    }

    // Check for duplicate collection name for this user
    const existingCollection = await db.collection.findUnique({
      where: { userId_name: { userId: user.id, name: name.trim() } },
    });
    if (existingCollection) {
      return sendApiResponse(c, {
        status: 409,
        message: "A collection with this name already exists.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "name",
            message: "A collection with this name already exists.",
          },
        ],
      });
    }

    // Create collection
    const newCollection = await db.collection.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
    });

    return sendApiResponse(c, {
      status: 201,
      message: "Collection created successfully.",
      data: newCollection,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Create Collection Error:", error);
    if (error.code === "P2002") {
      // Prisma unique constraint violation
      return sendApiResponse(c, {
        status: 409,
        message: "A collection with this name already exists.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "name",
            message: "A collection with this name already exists.",
          },
        ],
      });
    }
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to create collection.",
      data: null,
      metadata: null,
      errors: [
        { field: "server", message: error.message || "Internal Server Error" },
      ],
    });
  }
};

// --- List Collections Handler ---
export const listCollections = async (c: Context) => {
  const user = getAuthUser(c);

  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to list collections.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  try {
    // 1. Get query parameters
    const { page, pageSize, search } = c.req.query();
    const pageNumber = parseInt(page as string) || 1;
    const pageSizeNumber = parseInt(pageSize as string) || 10;
    const searchQuery = search ? search.trim() : null;

    // 2. Define the base WHERE clause for filtering
    const whereClause: Prisma.CollectionWhereInput = {
      // Use 'any' or define a proper Prisma WhereInput type
      userId: user.id,
    };

    if (searchQuery) {
      whereClause.name = {
        contains: searchQuery,
      };
    }

    // 3. Get the TOTAL count of matching records (without pagination)
    const totalCount = await db.collection.count({
      where: whereClause,
    });

    // 4. Handle case where no collections are found at all
    if (totalCount === 0) {
      return sendApiResponse(c, {
        status: 200,
        message: searchQuery
          ? "No collections found matching your search."
          : "No collections found.",
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

    // 5. Calculate pagination metadata based on the *total* count
    const totalPages = Math.ceil(totalCount / pageSizeNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    const nextPage = hasNextPage ? pageNumber + 1 : null;
    const previousPage = hasPreviousPage ? pageNumber - 1 : null;

    // 6. Fetch the collections for the CURRENT page
    const collections = await db.collection.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSizeNumber,
      take: pageSizeNumber,
    });

    // Note: We don't need the `if (!collections || collections.length === 0)` check here
    // anymore because we already handled the `totalCount === 0` case.
    // If totalCount > 0, but this specific page is empty (e.g., page=100 but only 50 items exist),
    // it's still a valid scenario, and we should return an empty array for `data`.

    // 7. Return the successful response with correct metadata
    return sendApiResponse(c, {
      status: 200,
      message: "Collections retrieved successfully.",
      data: collections, // This might be empty if requested page is beyond totalPages
      metadata: {
        totalCount: totalCount, // Use the actual total count
        page: pageNumber,
        pageSize: pageSizeNumber,
        totalPages: totalPages, // Use calculated total pages
        hasNextPage: hasNextPage, // Use calculated value
        hasPreviousPage: hasPreviousPage, // Use calculated value
        nextPage: nextPage, // Use calculated value
        previousPage: previousPage, // Use calculated value
      },
      errors: null,
    });
  } catch (error: any) {
    console.error("List Collections Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve collections.",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "Internal Server Error",
        },
      ],
    });
  }
};

// --- Get Bookmarks by collections  Handler ---
export const getBookmarksByCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to create a collection.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  const { collectionId } = c.req.param();

  try {
    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: user.id,
        collections: {
          some: {
            id: collectionId,
          },
        },
      },
      include: { tags: { select: { id: true, name: true } } },
    });

    if (!bookmarks) {
      return sendApiResponse(c, {
        status: 404,
        message: "Bookmarks not found.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "bookmarks",
            message:
              "Bookmarks not found or you do not have permission to view them.",
          },
        ],
      });
    }
    return sendApiResponse(c, {
      status: 200,
      message: "Bookmarks retrieved successfully.",
      data: bookmarks,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Get Bookmarks Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve bookmarks.",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "Internal Server Error",
        },
      ],
    });
  }
};

// --- Get Collection Details Handler ---
export const getCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to create a collection.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  const { id } = c.req.param();

  try {
    const collection = await db.collection.findUnique({
      where: {
        id: id,
        userId: user.id, // Ensure user owns the collection
      },
      include: {
        bookmarks: {
          orderBy: { createdAt: "desc" },
          include: { tags: { select: { id: true, name: true } } },
        },
      },
    });

    if (!collection) {
      return sendApiResponse(c, {
        status: 404,
        message: "Collection not found.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message:
              "Collection not found or you do not have permission to view it.",
          },
        ],
      });
    }
    return sendApiResponse(c, {
      status: 200,
      message: "Collection retrieved successfully.",
      data: collection,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Get Collection Error:", error);
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve collection.",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "Internal Server Error",
        },
      ],
    });
  }
};

// --- Update Collection Handler ---
export const updateCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to create a collection.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  try {
    const { id, name } = await c.req.json();

    // --- Prevent renaming "Unsorted" ---
    if (name.trim().toLowerCase() === "unsorted") {
      return sendApiResponse(c, {
        status: 403,
        message: "Cannot rename the default 'Unsorted' collection.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message: "Cannot rename 'Unsorted' collection.",
          },
        ],
      });
    }

    if (!id || typeof id !== "string" || id.trim() === "") {
      return sendApiResponse(c, {
        status: 400,
        message: "Collection ID is required.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "id",
            message: "Collection ID is required.",
          },
        ],
      });
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return sendApiResponse(c, {
        status: 400,
        message: "Collection name is required.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "name",
            message: "Collection name is required.",
          },
        ],
      });
    }

    const conflictingCollection = await db.collection.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        id: { not: id },
      },
    });
    if (conflictingCollection) {
      return sendApiResponse(c, {
        status: 409,
        message: "A collection with this name already exists.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "name",
            message: "A collection with this name already exists.",
          },
        ],
      });
    }

    const updateResult = await db.collection.updateMany({
      where: {
        id: id.trim(),
        userId: user.id,
      },
      data: {
        name: name.trim(),
      },
    });

    if (updateResult.count === 0) {
      return sendApiResponse(c, {
        status: 404,
        message:
          "Collection not found or you do not have permission to update it.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message:
              "Collection not found or you do not have permission to update it.",
          },
        ],
      });
    }

    const updatedCollection = await db.collection.findUnique({ where: { id } });

    if (!updatedCollection) {
      return sendApiResponse(c, {
        status: 404,
        message: "Updated collection not found.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message: "Updated collection not found.",
          },
        ],
      });
    }
    return sendApiResponse(c, {
      status: 200,
      message: "Collection updated successfully.",
      data: updatedCollection,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Update Collection Error:", error);
    if (error.code === "P2002") {
      return sendApiResponse(c, {
        status: 409,
        message: "A collection with this name already exists.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "name",
            message: "A collection with this name already exists.",
          },
        ],
      });
    }
    if (error.code === "P2025") {
      return sendApiResponse(c, {
        status: 404,
        message: "Collection not found.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message: "Collection not found.",
          },
        ],
      });
    }
    return sendApiResponse(c, {
      status: 500,
      message: "Failed to update collection.",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "Internal Server Error",
        },
      ],
    });
  }
};

// --- Delete Collection Handler ---
export const deleteCollection = async (c: Context) => {
  const user = getAuthUser(c);
  if (!user) {
    return sendApiResponse(c, {
      status: 401,
      message: "Authentication required to delete a collection.",
      data: null,
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  const { id } = c.req.param();

  try {
    // Fetch the collection to be deleted
    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (!collection || collection.userId !== user.id) {
      return sendApiResponse(c, {
        status: 404,
        message:
          "Collection not found or you do not have permission to delete it.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message: "Collection not found or permission denied.",
          },
        ],
      });
    }

    if (collection.name.trim().toLowerCase() === "unsorted") {
      return sendApiResponse(c, {
        status: 403,
        message: "Cannot delete the default 'Unsorted' collection.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message: "Cannot delete the 'Unsorted' collection.",
          },
        ],
      });
    }

    // Find user's Unsorted collection
    const unsortedCollection = await db.collection.findFirst({
      where: {
        userId: user.id,
        isSystem: true,
      },
    });

    if (!unsortedCollection) {
      return sendApiResponse(c, {
        status: 500,
        message: "Default 'Unsorted' collection not found for user.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message:
              "'Unsorted' collection missing. Cannot reassign bookmarks.",
          },
        ],
      });
    }

    // Find all bookmarks attached to this collection
    const bookmarks = await db.bookmark.findMany({
      where: {
        collections: {
          some: { id },
        },
      },
      select: { id: true },
    });

    await db.$transaction([
      // Disconnect and Reconnect each bookmark
      ...bookmarks.map((bookmark) =>
        db.bookmark.update({
          where: { id: bookmark.id },
          data: {
            collections: {
              disconnect: [{ id }], // Remove from the deleted collection
              connect: [{ id: unsortedCollection.id }], // Add to Unsorted
            },
          },
        })
      ),
      // Now delete the collection
      db.collection.delete({
        where: { id },
      }),
    ]);

    return sendApiResponse(c, {
      status: 200,
      message: "Collection deleted and bookmarks moved to 'Unsorted'.",
      data: null,
      metadata: null,
      errors: null,
    });
  } catch (error: any) {
    console.error("Delete Collection Error:", error);

    if (error.code === "P2025") {
      return sendApiResponse(c, {
        status: 404,
        message: "Collection not found.",
        data: null,
        metadata: null,
        errors: [
          {
            field: "collection",
            message: "Collection not found.",
          },
        ],
      });
    }

    return sendApiResponse(c, {
      status: 500,
      message: "Failed to delete collection.",
      data: null,
      metadata: null,
      errors: [
        {
          field: "server",
          message: error.message || "Internal Server Error",
        },
      ],
    });
  }
};
