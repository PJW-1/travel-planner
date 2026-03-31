import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();
  const allowedOrigins = env.clientOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("허용되지 않은 출처입니다."));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "travel-master-api",
      timestamp: new Date().toISOString(),
      sessionStore: env.session.store,
    });
  });

  app.use("/api", apiRouter);

  app.use((error, _req, res, _next) => {
    const status = error.status ?? 500;

    res.status(status).json({
      message: error.message ?? "서버 오류가 발생했습니다.",
    });
  });

  return app;
}
