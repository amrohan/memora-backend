import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import { getRecentBookmarks, listBookmarks } from "../handlers/bookmarkHandler";

const dashboardRoutes = new Hono();

dashboardRoutes.use("*", authMiddleware);

dashboardRoutes.get("/", listBookmarks);
dashboardRoutes.get("/recent-bookmarks", getRecentBookmarks);

export default dashboardRoutes;
