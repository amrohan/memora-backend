import { Context } from "hono";
import db from "../db";
import { getAuthUser } from "../lib/authUtils";
import { sendApiResponse } from "../lib/responseUtils";
import { Prisma } from "../../generated/prisma";

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
    const { page, pageSize, search } = c.req.query();
    const pageNumber = parseInt(page as string) || 1;
    const pageSizeNumber = parseInt(pageSize as string) || 10;
    const searchQuery = search ? search.trim() : null;

    const whereClause: Prisma.CollectionWhereInput = {
      userId: user.id,
    };

    if (searchQuery) {
      whereClause.name = {
        contains: searchQuery,
      };
    }

    const totalCount = await db.collection.count({
      where: whereClause,
    });

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

    const totalPages = Math.ceil(totalCount / pageSizeNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    const nextPage = hasNextPage ? pageNumber + 1 : null;
    const previousPage = hasPreviousPage ? pageNumber - 1 : null;

    const collections = await db.collection.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSizeNumber,
      take: pageSizeNumber,
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Collections retrieved successfully.",
      data: collections,
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
        userId: user.id,
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

    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (collection?.isSystem) {
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

    const bookmarks = await db.bookmark.findMany({
      where: {
        collections: {
          some: { id },
        },
      },
      select: { id: true },
    });

    await db.$transaction([
      ...bookmarks.map((bookmark) =>
        db.bookmark.update({
          where: { id: bookmark.id },
          data: {
            collections: {
              disconnect: [{ id }],
              connect: [{ id: unsortedCollection.id }],
            },
          },
        })
      ),

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
