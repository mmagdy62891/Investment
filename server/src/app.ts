import express from "express";
import cors from "cors";
import { analyzeRouter } from "./routes/analyze.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", analyzeRouter);
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  return app;
}
