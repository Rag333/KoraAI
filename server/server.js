import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import apiRouter from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure CORS (Allow all origins and preflight requests)
app.use(cors());
app.options("*", cors());

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.use(express.json());

// Normalize double slashes in incoming request URLs
app.use((req, _res, next) => {
  req.url = req.url.replace(/\/+/g, "/");
  next();
});

// API Routes
app.use("/api", apiRouter);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Kora AI Backend" });
});

// Root API route handler
app.get("/", (_req, res) => {
  res.json({
    message: "Kora AI Backend API is running.",
    health: "/health",
    api: "/api"
  });
});

// Serve frontend static files if present (for unified single-server deployments)
const possibleDistPaths = [
  path.join(__dirname, "..", "client", "dist"),
  path.join(__dirname, "client", "dist")
];

const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  app.get("/dashboard", (_req, res) => {
    return res.redirect("/#/dashboard");
  });
  app.get("/dashboard/*", (_req, res) => {
    return res.redirect("/#/dashboard");
  });

  app.use(express.static(clientDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// API 404 JSON Handler
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

// Global JSON Error Handler
app.use((err, _req, res, _next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
