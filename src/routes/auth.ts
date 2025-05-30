import { Hono } from "hono";
import {
  registerUser,
  loginUser,
  resetPassword,
  forgotPassword,
  validateResetToken,
  resetPasswordWithToken,
} from "../handlers/authHandler";
import { authMiddleware } from "../middleware/authMiddleware";

const authRoutes = new Hono();

authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/register", registerUser);

authRoutes.post("/validate-reset-token", validateResetToken);
authRoutes.post("/reset-password-token", resetPasswordWithToken);

// POST /auth/login
authRoutes.post("/login", loginUser);

authRoutes.use("*", authMiddleware);
authRoutes.post("/resetpassword", resetPassword);

export default authRoutes;
