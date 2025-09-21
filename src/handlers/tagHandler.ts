import { Context } from "hono";
import db from "../db";
import { AuthUser } from "../types";
import { getAuthUser } from "../lib/authUtils";
import { sendApiResponse } from "../lib/responseUtils";
import { Prisma } from "../../generated/prisma";

/**
 * Handles the retrieval of all unique tags stored in the database globally.
 * @param c Hono context object
 * @returns JSON response with a list of all tags or an error object.
 */
export const listAllTags = async (c: Context) => {
  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
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
      errors: [{ field: "database", message: error.message }],
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
      metadata: null,
      errors: [{ field: "authentication", message: "Unauthorized" }],
    });
  }

  try {
    const { page, pageSize, search } = c.req.query();
    const pageNumber = parseInt(page as string) || 1;
    const pageSizeNumber = parseInt(pageSize as string) || 20;
    const searchQuery = search ? search.trim() : null;

    const whereClause: Prisma.TagWhereInput = {
      userId: user.id,
    };

    if (searchQuery) {
      whereClause.name = {
        contains: searchQuery,
      };
    }

    const totalCount = await db.tag.count({
      where: whereClause,
    });

    if (totalCount === 0) {
      return sendApiResponse(c, {
        status: 200,
        message: searchQuery
          ? "No tags found matching your search."
          : "No tags found for this user.",
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

    const userTags = await db.tag.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
      skip: (pageNumber - 1) * pageSizeNumber,
      take: pageSizeNumber,
    });

    return sendApiResponse(c, {
      status: 200,
      message: "User tags retrieved successfully.",
      data: userTags,
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
    console.error(`List User Tags Error for user ${user.id}:`, error);

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
            message: "There was an issue with the filter criteria.",
          },
        ],
      });
    }

    return sendApiResponse(c, {
      status: 500,
      message: "Failed to retrieve user tags.",
      data: null,
      metadata: null,
      errors: [
        {
          field: "database",
          message: error.message || "Internal Server Error",
        },
      ],
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
    const tag = await db.tag.findUnique({
      where: { id },
    });

    if (!tag || tag.userId !== user.id) {
      return sendApiResponse(c, {
        status: 404,
        message: "Tag not found or permission denied.",
        data: null,
        errors: [
          { field: "tag", message: "Tag not found or permission denied." },
        ],
        metadata: null,
      });
    }

    const bookmarks = await db.bookmark.findMany({
      where: {
        tags: {
          some: { id },
        },
      },
      select: { id: true },
    });

    await Promise.all(
      bookmarks.map((bookmark) =>
        db.bookmark.update({
          where: { id: bookmark.id },
          data: {
            tags: {
              disconnect: { id },
            },
          },
        })
      )
    );

    await db.tag.delete({
      where: { id },
    });

    return sendApiResponse(c, {
      status: 200,
      message: "Tag deleted successfully and removed from bookmarks.",
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
