import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { buildApiRouter } from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";

function createCorsOriginValidator() {
  const explicitOrigins = new Set(
    String(env.clientOrigin || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (explicitOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    try {
      const parsed = new URL(origin);
      const isLocalhost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

      if (isLocalhost) {
        callback(null, true);
        return;
      }
    } catch {
      // Ignore parse failure and reject below.
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

function createApp(io) {
  const app = express();

  app.use(
    cors({
      origin: createCorsOriginValidator(),
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
