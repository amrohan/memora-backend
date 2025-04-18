import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createCollection,
  deleteCollection,
  getBookmarksByCollection,
  listCollections,
  updateCollection,
} from "../handlers/collectionHandler";

export const collectionRoute = new Hono();

collectionRoute.use("*", authMiddleware);

// GET /collections -> List all collections for the logged-in user
collectionRoute.get("/", listCollections);
// GET /collections/:id -> Get details of a specific collection
collectionRoute.get("/:id", listCollections);
// GET /collections/:id/bookmarks -> Get bookmarks in a specific collection
collectionRoute.get("/:id/bookmarks", getBookmarksByCollection);
// POST /collections -> Create a new collection
collectionRoute.post("/", createCollection);
// PUT /collections/:id -> Update a collection (name)
collectionRoute.put("/:id", updateCollection);

collectionRoute.delete("/:id", deleteCollection);
