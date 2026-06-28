import dotenv from "dotenv";
dotenv.config();

import express from "express";

import { fileURLToPath } from "url";
import connectDB from "./src/config/mongo.config.js";
import short_url from "./src/routes/short_url.route.js";
import auth_routes from "./src/routes/auth.route.js";
import { redirectFromShortUrl } from "./src/controller/short_url.controller.js";
import { errorHandler } from "./src/utils/errorHandler.js";
import { attchUser } from "./src/utils/attchUser.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// ─── CORS (dev only — in prod frontend is same origin) ─────────────────────
if (!isProd) {
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ],
      credentials: true,
    })
  );
}

// ─── Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(attchUser);


app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});


app.use("/api/auth", auth_routes);
app.use("/api/create", short_url);

// Only match short slugs — not /api, /health, /assets, /favicon.svg etc.
app.get("/:id", (req, res, next) => {
  const { id } = req.params;
  // Skip if it looks like a static asset or known frontend route
  const staticOrFrontend = [
    "favicon.svg", "icons.svg", "index.html",
    "auth", "dashboard", "advanced-dashboard", "settings",
  ];
  if (
    staticOrFrontend.includes(id) ||
    id.startsWith("assets") ||
    id.startsWith("_")
  ) {
    return next();
  }
  return redirectFromShortUrl(req, res, next);
});


if (isProd) {
  const publicPath = path.join(__dirname, "public");
  app.use(express.static(publicPath));

  
 app.use((_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ─── Error handler ────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT} [${isProd ? "production" : "development"}]`)
  );
});
}
export default app;
