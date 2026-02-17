export type Id = string;

export interface User {
  id: Id;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BoardSummary {
  id: Id;
  title: string;
  description: string;
  role: "owner" | "member";
  createdAt: string;
  updatedAt: string;
}

export interface ListItem {
  id: Id;
  boardId: Id;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: Id;
  boardId: Id;
  listId: Id;
  title: string;
  description: string;
  assignees?: User[];
  assigneeIds?: Id[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: Id;
  type: string;
  message: string;
  meta: Record<string, unknown>;
  actor?: User;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
