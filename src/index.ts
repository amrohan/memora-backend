import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { routesHandler } from "./routes";

config();
const app = new Hono();

// --- Middleware ---
app.use("*", logger());
app.use("*", secureHeaders());
app.use("/api/*", cors());
app.use(
  "/api2/*",
  cors({
    origin:
      "http://localhost:4200,https://memora.pages.dev,https://localhost:4200",
    allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
    allowMethods: ["POST", "GET", "PUT", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  }),
);

// --- Routing ---
app.get("/", (c) => c.text("Bookmark Manager API - Welcome!"));

// Mount API route groups
app.route("/api", routesHandler);

// --- Custom Not Found Handler ---
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `The route ${c.req.method} ${c.req.path} does not exist.`,
    },
    404,
  );
});

// --- Global Error Handler ---
app.onError((err, c) => {
  console.error("Unhandled Application Error:", err);
  const errorMessage =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message;
  return c.json({ error: "Internal Server Error", message: errorMessage }, 500);
});

const port = parseInt(process.env.PORT || "5004");

const getCurrentIndianTime = () => {
  try {
    return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch (e) {
    console.warn(
      "Could not format time for Asia/Kolkata timezone, using default locale.",
    );
    return new Date().toLocaleString();
  }
};

console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`🕰️  Current time in India: ${getCurrentIndianTime()} (IST)`);

serve({
  fetch: app.fetch,
  port: port,
});
