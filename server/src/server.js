import { createServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { BoardMember } from "./models/BoardMember.js";
import { isValidObjectId } from "./utils/boardAccess.js";

async function bootstrap() {
  await connectDb();

  const io = new Server({
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Missing auth token"));
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.data.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };
      return next();
    } catch {
      return next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("board:join", async ({ boardId }, ack) => {
      try {
        if (!boardId || !isValidObjectId(boardId)) {
          if (ack) ack({ ok: false, message: "Invalid boardId" });
          return;
        }

        const membership = await BoardMember.findOne({
          boardId,
          userId: socket.data.user.id,
        });

        if (!membership) {
          if (ack) ack({ ok: false, message: "Board access denied" });
          return;
        }

        socket.join(`board:${boardId}`);
        if (ack) ack({ ok: true });
      } catch {
        if (ack) ack({ ok: false, message: "Failed to join board room" });
      }
    });

    socket.on("board:leave", ({ boardId }) => {
      if (!boardId || !isValidObjectId(boardId)) return;
      socket.leave(`board:${boardId}`);
    });
  });

  const app = createApp(io);
  const httpServer = createServer(app);

  io.attach(httpServer);

  httpServer.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});
