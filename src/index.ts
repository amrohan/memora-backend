import { Hono } from "hono";
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

// --- Routing ---
app.get("/", (c) => c.text("Bookmark Manager API - Welcome!")); // Root endpoint

// Mount API route groups
app.route("/api", routesHandler);

// --- Custom Not Found Handler ---
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `The route ${c.req.method} ${c.req.path} does not exist.`,
    },
    404
  );
});

// --- Global Error Handler ---
app.onError((err, c) => {
  console.error("Unhandled Application Error:", err);
  // Avoid leaking detailed errors in production
  const errorMessage =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message;
  return c.json({ error: "Internal Server Error", message: errorMessage }, 500);
});

// --- Server ---
const port = parseInt(process.env.PORT || "3000"); // Use PORT from env (like Replit) or default to 3000

// Function to get current Indian time
const getCurrentIndianTime = () => {
  try {
    return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch (e) {
    // Fallback if timezone data is unavailable in some minimal environments
    console.warn(
      "Could not format time for Asia/Kolkata timezone, using default locale."
    );
    return new Date().toLocaleString();
  }
};

console.log(`🚀 Server running on http://localhost:${port}`);
// Display current time for the requested location (Mumbai/India)
console.log(`🕰️  Current time in India: ${getCurrentIndianTime()} (IST)`);

serve({
  fetch: app.fetch,
  port: port,
});
