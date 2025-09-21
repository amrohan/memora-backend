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

tagRoutes.get("/", listUserTags);
tagRoutes.get("/:id", getTagByTagId);

tagRoutes.post("/", createTag);
tagRoutes.put("/:id", updateTag);

tagRoutes.delete("/:id", deleteTag);
