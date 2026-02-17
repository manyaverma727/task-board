import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface AppState {
  token: string | null;
  user: User | null;
  selectedBoardId: string | null;
  taskSearch: string;
  taskPage: number;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setSelectedBoardId: (boardId: string | null) => void;
  setTaskSearch: (search: string) => void;
  setTaskPage: (page: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      selectedBoardId: null,
      taskSearch: "",
      taskPage: 1,
      setAuth: (token, user) => set({ token, user }),
      logout: () =>
        set({
          token: null,
          user: null,
          selectedBoardId: null,
          taskSearch: "",
          taskPage: 1,
        }),
      setSelectedBoardId: (selectedBoardId) => set({ selectedBoardId, taskPage: 1 }),
      setTaskSearch: (taskSearch) => set({ taskSearch, taskPage: 1 }),
      setTaskPage: (taskPage) => set({ taskPage }),
    }),
    {
      name: "task-collab-app-store",
    }
  )
);
