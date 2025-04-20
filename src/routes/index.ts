// Group all routes here

import { Hono } from "hono";
import authRoutes from "./auth";
import bookmarkRoutes from "./bookmarks";
import dashboardRoutes from "./dashboard";
import { collectionRoute } from "./collections";
import { tagRoutes } from "./tags";
import { userRoutes } from "./user";

export const routesHandler = new Hono();

routesHandler.route("/auth", authRoutes);
routesHandler.route("/bookmarks", bookmarkRoutes);
routesHandler.route("/dashboard", dashboardRoutes);
routesHandler.route("/collections", collectionRoute);
routesHandler.route("/tags", tagRoutes);
routesHandler.route("/user", userRoutes);
