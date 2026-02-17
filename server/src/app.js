import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { buildApiRouter } from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";

function createApp(io) {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );

  app.use(express.json());

  app.use("/api", buildApiRouter(io));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export { createApp };
