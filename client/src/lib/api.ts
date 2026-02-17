import type {
  Activity,
  AuthResponse,
  BoardSummary,
  ListItem,
  PaginatedResponse,
  Task,
  User,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: ApiMethod;
  token?: string | null;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export const api = {
  socketUrl: new URL(API_BASE).origin,

  signup(payload: { name: string; email: string; password: string }) {
    return request<AuthResponse>("/auth/signup", { method: "POST", body: payload });
  },

  login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", { method: "POST", body: payload });
  },

  me(token: string) {
    return request<{ user: User }>("/auth/me", { token });
  },

  getBoards(token: string) {
    return request<{ items: BoardSummary[] }>("/boards", { token });
  },

  createBoard(token: string, payload: { title: string; description: string }) {
    return request<{ board: BoardSummary }>("/boards", {
      method: "POST",
      token,
      body: payload,
    });
  },

  getBoard(token: string, boardId: string) {
    return request<{ board: Omit<BoardSummary, "role">; lists: ListItem[] }>(
      `/boards/${boardId}`,
      {
        token,
      }
    );
  },

  createList(
    token: string,
    boardId: string,
    payload: {
      title: string;
      position?: number;
    }
  ) {
    return request<{ list: ListItem }>(`/boards/${boardId}/lists`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateList(
    token: string,
    listId: string,
    payload: {
      title?: string;
      position?: number;
    }
  ) {
    return request<{ list: ListItem }>(`/lists/${listId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  deleteList(token: string, listId: string) {
    return request<void>(`/lists/${listId}`, {
      method: "DELETE",
      token,
    });
  },

  getTasks(
    token: string,
    boardId: string,
    params: { search?: string; page?: number; limit?: number }
  ) {
    const query = new URLSearchParams();

    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const queryString = query.toString();

    return request<PaginatedResponse<Task>>(
      `/boards/${boardId}/tasks${queryString ? `?${queryString}` : ""}`,
      {
        token,
      }
    );
  },

  createTask(
    token: string,
    listId: string,
    payload: {
      title: string;
      description?: string;
    }
  ) {
    return request<{ task: Task }>(`/lists/${listId}/tasks`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateTask(
    token: string,
    taskId: string,
    payload: {
      title?: string;
      description?: string;
    }
  ) {
    return request<{ task: Task }>(`/tasks/${taskId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  moveTask(
    token: string,
    taskId: string,
    payload: {
      targetListId: string;
      targetPosition?: number;
    }
  ) {
    return request<{ task: Task }>(`/tasks/${taskId}/move`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  assignTask(
    token: string,
    taskId: string,
    payload: {
      assigneeIds: string[];
    }
  ) {
    return request<{ task: Task }>(`/tasks/${taskId}/assign`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  deleteTask(token: string, taskId: string) {
    return request<void>(`/tasks/${taskId}`, {
      method: "DELETE",
      token,
    });
  },

  getMembers(token: string, boardId: string) {
    return request<{
      items: {
        id: string;
        role: "owner" | "member";
        user: User;
      }[];
    }>(`/boards/${boardId}/members`, { token });
  },

  addMember(token: string, boardId: string, payload: { email: string }) {
    return request<{ membership: { id: string } }>(`/boards/${boardId}/members`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  getActivities(token: string, boardId: string, params: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const queryString = query.toString();

    return request<PaginatedResponse<Activity>>(
      `/boards/${boardId}/activities${queryString ? `?${queryString}` : ""}`,
      { token }
    );
  },
};
