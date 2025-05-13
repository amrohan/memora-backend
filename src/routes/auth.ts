import { Hono } from "hono";
import {
  registerUser,
  loginUser,
  resetPassword,
} from "../handlers/authHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const authRoutes = new Hono();

// POST /auth/register

authRoutes.post("/register", registerUser);

// POST /auth/login
authRoutes.post("/login", loginUser);

authRoutes.use("*", authMiddleware);
authRoutes.post("/resetpassword", resetPassword);

export default authRoutes;
