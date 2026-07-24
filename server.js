import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import apiRouter from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, "frontend", "dist");

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

// Redirect plain /dashboard path to the hash-based dashboard route
app.get("/dashboard", (_req, res) => {
  return res.redirect("/#/dashboard");
});
app.get("/dashboard/*", (_req, res) => {
  return res.redirect("/#/dashboard");
});

app.use(express.static(frontendDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) {
      res
        .status(200)
        .send(
          'API is running. Build the React app with "npm run build" to serve the UI from Express.',
        );
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
