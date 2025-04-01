import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  addBookmark,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  listBookmarks, // Can use the list handler here too if desired for GET /
} from "../handlers/bookmarkHandler";

const bookmarkRoutes = new Hono();

// Apply auth middleware to all bookmark routes
bookmarkRoutes.use("*", authMiddleware);

// GET /bookmarks -> List all bookmarks for the logged-in user
bookmarkRoutes.get("/", listBookmarks); // Reuse dashboard logic

// POST /bookmarks -> Add a new bookmark (fetches metadata)
bookmarkRoutes.post("/", addBookmark);

// GET /bookmarks/:id -> Get details of a specific bookmark
bookmarkRoutes.get("/:id", getBookmark);

// PUT /bookmarks/:id -> Update a bookmark (title, desc, tags, collections)
bookmarkRoutes.put("/:id", updateBookmark);

// DELETE /bookmarks/:id -> Delete a bookmark
bookmarkRoutes.delete("/:id", deleteBookmark);

// Note: The original request mentioned an "edit bookmark page".
// In an API context, this translates to:
// 1. GET /bookmarks/:id to fetch data for the edit form.
// 2. PUT /bookmarks/:id to submit the updated data from the form.

export default bookmarkRoutes;
