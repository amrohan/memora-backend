import { Hono } from "hono";
import {
  updateUserInformation,
  getUserInformation,
} from "../handlers/userHandler";
import { authMiddleware } from "../middleware/authMiddleware";

export const userRoutes = new Hono();

userRoutes.use("*", authMiddleware);
userRoutes.get("/", getUserInformation);
userRoutes.post("/", updateUserInformation);
