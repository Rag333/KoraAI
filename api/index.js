import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "../routes/api.js";

const app = express();

app.use(cors());
app.use(express.json());

// Support both /api path prefix and root endpoint
app.use("/api", apiRouter);
app.use("/", apiRouter);

export default app;
