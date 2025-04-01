import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createTag,
  deleteTag,
  getTagByTagId,
  listUserTags,
  updateTag,
} from "../handlers/tagHandler";

export const tagRoutes = new Hono();

tagRoutes.use("*", authMiddleware);

// GET /tags -> List all unique tags
tagRoutes.get("/", listUserTags);
tagRoutes.get("/:id", getTagByTagId);
// GET /tags/:id -> Get details of a specific tag
tagRoutes.post("/", createTag);
tagRoutes.put("/:id", updateTag);
// DELETE /tags/:id -> Delete a tag
tagRoutes.delete("/:id", deleteTag);
