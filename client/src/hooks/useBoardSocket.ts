import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useBoardSocket(token: string | null, boardId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !boardId) return;

    const socket = io(api.socketUrl, {
      auth: { token },
    });

    socket.on("connect", () => {
      socket.emit("board:join", { boardId });
    });

    socket.on("board:event", () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boardTasks", boardId] });
      queryClient.invalidateQueries({ queryKey: ["members", boardId] });
      queryClient.invalidateQueries({ queryKey: ["activities", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    });

    return () => {
      socket.emit("board:leave", { boardId });
      socket.disconnect();
    };
  }, [token, boardId, queryClient]);
}
