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

// Configure CORS
const corsOrigin = process.env.FRONTEND_URL || "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// API Routes
app.use("/api", apiRouter);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Kora AI Backend" });
});

// Serve frontend static files if present (for single-server deployments)
const possibleDistPaths = [
  path.join(__dirname, "..", "client", "dist"),
  path.join(__dirname, "client", "dist")
];

const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  // Redirect plain /dashboard path to the hash-based dashboard route
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
} else {
  app.get("/", (_req, res) => {
    res.json({
      message: "Kora AI Backend API is running.",
      health: "/health",
      api: "/api"
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
