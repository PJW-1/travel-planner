import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "travel-master-api",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api", apiRouter);

  return app;
}

