import express from "express";
import { authRouter } from "./authRoutes.js";
import { buildBoardRouter } from "./boardRoutes.js";
import { buildListRouter } from "./listRoutes.js";
import { buildTaskRouter } from "./taskRoutes.js";

function buildApiRouter(io) {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({ status: "ok", at: new Date().toISOString() });
  });

  router.use("/auth", authRouter);
  router.use("/boards", buildBoardRouter(io));
  router.use("/lists", buildListRouter(io));
  router.use("/tasks", buildTaskRouter(io));

  return router;
}

export { buildApiRouter };
