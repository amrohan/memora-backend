import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import { getRecentBookmarks, listBookmarks } from "../handlers/bookmarkHandler";

const dashboardRoutes = new Hono();

// Apply auth middleware
dashboardRoutes.use("*", authMiddleware);

// GET /dashboard -> Use the listBookmarks handler
dashboardRoutes.get("/", listBookmarks);
dashboardRoutes.get("/recent-bookmarks", getRecentBookmarks); // Reuse the same handler for recent bookmarks
//

export default dashboardRoutes;
