import { Activity } from "../models/Activity.js";

export async function logActivity({ boardId, actorId, type, message, meta = {} }) {
  return Activity.create({
    boardId,
    actorId,
    type,
    message,
    meta,
  });
}

export function emitBoardEvent(io, boardId, event, payload) {
  io.to(`board:${boardId}`).emit("board:event", {
    event,
    payload,
    at: new Date().toISOString(),
  });
}
