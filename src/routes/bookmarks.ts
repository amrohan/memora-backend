import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  addBookmark,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  listBookmarks,
  getTotalBookmarksCount,
} from "../handlers/bookmarkHandler";

const bookmarkRoutes = new Hono();

bookmarkRoutes.use("*", authMiddleware);

bookmarkRoutes.get("/", listBookmarks);

bookmarkRoutes.post("/", addBookmark);

bookmarkRoutes.get("/count", getTotalBookmarksCount);

bookmarkRoutes.get("/:id", getBookmark);

bookmarkRoutes.put("/:id", updateBookmark);

bookmarkRoutes.delete("/:id", deleteBookmark);

export default bookmarkRoutes;
