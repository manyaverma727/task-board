import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./lib/api";
import { useAppStore } from "./lib/store";
import { useBoardSocket } from "./hooks/useBoardSocket";
import { AuthPanel } from "./components/AuthPanel";
import { BoardSidebar } from "./components/BoardSidebar";
import { ListColumn } from "./components/ListColumn";
import "./styles/app.css";

export default function App() {
  const queryClient = useQueryClient();

  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);
  const selectedBoardId = useAppStore((state) => state.selectedBoardId);
  const taskSearch = useAppStore((state) => state.taskSearch);
  const taskPage = useAppStore((state) => state.taskPage);

  const setAuth = useAppStore((state) => state.setAuth);
  const logout = useAppStore((state) => state.logout);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const setSelectedBoardId = useAppStore((state) => state.setSelectedBoardId);
  const setTaskSearch = useAppStore((state) => state.setTaskSearch);
  const setTaskPage = useAppStore((state) => state.setTaskPage);

  const [inviteEmail, setInviteEmail] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);

  const toErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Request failed";

  useBoardSocket(token, selectedBoardId);

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => api.getBoards(token as string),
    enabled: Boolean(token),
  });

  const boardQuery = useQuery({
    queryKey: ["board", selectedBoardId],
    queryFn: () => api.getBoard(token as string, selectedBoardId as string),
    enabled: Boolean(token && selectedBoardId),
  });

  const tasksQuery = useQuery({
    queryKey: ["boardTasks", selectedBoardId, taskSearch, taskPage],
    queryFn: () =>
      api.getTasks(token as string, selectedBoardId as string, {
        search: taskSearch,
        page: taskPage,
        limit: 50,
      }),
    enabled: Boolean(token && selectedBoardId),
  });

  const membersQuery = useQuery({
    queryKey: ["members", selectedBoardId],
    queryFn: () => api.getMembers(token as string, selectedBoardId as string),
    enabled: Boolean(token && selectedBoardId),
  });

  const activitiesQuery = useQuery({
    queryKey: ["activities", selectedBoardId],
    queryFn: () => api.getActivities(token as string, selectedBoardId as string, { page: 1, limit: 20 }),
    enabled: Boolean(token && selectedBoardId),
  });

  const createBoard = useMutation({
    mutationFn: (payload: { title: string; description: string }) =>
      api.createBoard(token as string, payload),
    onSuccess: (data) => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setSelectedBoardId(data.board.id);
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const createList = useMutation({
    mutationFn: (payload: { title: string }) =>
      api.createList(token as string, selectedBoardId as string, payload),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["board", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const updateList = useMutation({
    mutationFn: ({ listId, title }: { listId: string; title?: string }) =>
      api.updateList(token as string, listId, { title }),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["board", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const deleteList = useMutation({
    mutationFn: (listId: string) => api.deleteList(token as string, listId),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["board", selectedBoardId] });
      queryClient.invalidateQueries({ queryKey: ["boardTasks", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const createTask = useMutation({
    mutationFn: ({ listId, title, description }: { listId: string; title: string; description?: string }) =>
      api.createTask(token as string, listId, { title, description }),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["boardTasks", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, targetListId }: { taskId: string; targetListId: string }) =>
      api.moveTask(token as string, taskId, { targetListId, targetPosition: Date.now() }),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["boardTasks", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, title, description }: { taskId: string; title?: string; description?: string }) =>
      api.updateTask(token as string, taskId, { title, description }),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["boardTasks", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.deleteTask(token as string, taskId),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["boardTasks", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const assignTask = useMutation({
    mutationFn: ({ taskId, assigneeIds }: { taskId: string; assigneeIds: string[] }) =>
      api.assignTask(token as string, taskId, { assigneeIds }),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["boardTasks", selectedBoardId] });
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const addMember = useMutation({
    mutationFn: (email: string) =>
      api.addMember(token as string, selectedBoardId as string, {
        email,
      }),
    onSuccess: () => {
      setUiError(null);
      queryClient.invalidateQueries({ queryKey: ["members", selectedBoardId] });
      setInviteEmail("");
    },
    onError: (error) => setUiError(toErrorMessage(error)),
  });

  const lists = boardQuery.data?.lists || [];
  const tasks = tasksQuery.data?.items || [];
  const boards = boardsQuery.data?.items || [];

  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId, setSelectedBoardId]);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const tasksByList = useMemo(() => {
    return tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
      const key = task.listId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [tasks]);

  if (!token || !user) {
    return (
      <AuthPanel
        onAuthenticated={(data) => {
          setAuth(data.token, data.user);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <div className="topbar-actions">
          <button onClick={toggleTheme}>{theme === "light" ? "Dark mode" : "Light mode"}</button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="layout">
        <BoardSidebar
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelectBoard={setSelectedBoardId}
          onCreateBoard={(payload) => createBoard.mutate(payload)}
          creating={createBoard.isPending}
        />

        <main className="workspace">
          {!selectedBoardId ? (
            <div className="empty">Select or create a board</div>
          ) : (
            <>
              {uiError ? (
                <section className="error-banner">
                  <span>{uiError}</span>
                  <button onClick={() => setUiError(null)}>Dismiss</button>
                </section>
              ) : null}

              <section className="workspace-head">
                <div>
                  <h1>{boardQuery.data?.board.title || "Board"}</h1>
                  <p>{boardQuery.data?.board.description}</p>
                </div>

                <div className="controls">
                  <input
                    placeholder="Search tasks"
                    value={taskSearch}
                    onChange={(event) => setTaskSearch(event.target.value)}
                  />
                  <button disabled={taskPage <= 1} onClick={() => setTaskPage(taskPage - 1)}>
                    Prev
                  </button>
                  <span>
                    Page {tasksQuery.data?.page || 1} / {tasksQuery.data?.totalPages || 1}
                  </span>
                  <button
                    disabled={taskPage >= (tasksQuery.data?.totalPages || 1)}
                    onClick={() => setTaskPage(taskPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </section>

              <section className="board-tools">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!newListTitle.trim()) return;
                    createList.mutate({ title: newListTitle });
                    setNewListTitle("");
                  }}
                >
                  <input
                    placeholder="New list title"
                    value={newListTitle}
                    onChange={(event) => setNewListTitle(event.target.value)}
                  />
                  <button type="submit">Add list</button>
                </form>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!inviteEmail.trim()) return;
                    addMember.mutate(inviteEmail);
                  }}
                >
                  <input
                    placeholder="Invite by email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                  <button type="submit">Add member</button>
                </form>
              </section>

              <section className="board-columns">
                {lists.map((list) => (
                  <ListColumn
                    key={list.id}
                    list={list}
                    tasks={(tasksByList[list.id] || []).sort((a, b) => a.position - b.position)}
                    members={(membersQuery.data?.items || []).map((item) => item.user)}
                    onCreateTask={(listId, payload) =>
                      createTask.mutate({
                        listId,
                        title: payload.title,
                        description: payload.description,
                      })
                    }
                    onMoveTask={(taskId, targetListId) => moveTask.mutate({ taskId, targetListId })}
                    onUpdateList={(listId, payload) =>
                      updateList.mutate({ listId, title: payload.title })
                    }
                    onDeleteList={(listId) => deleteList.mutate(listId)}
                    onUpdateTask={(taskId, payload) =>
                      updateTask.mutate({ taskId, title: payload.title, description: payload.description })
                    }
                    onDeleteTask={(taskId) => deleteTask.mutate(taskId)}
                    onAssignTask={(taskId, assigneeIds) => assignTask.mutate({ taskId, assigneeIds })}
                  />
                ))}
              </section>

              <section className="activity-feed">
                <h2>Recent Activity</h2>
                <ul>
                  {(activitiesQuery.data?.items || []).map((activity) => (
                    <li key={activity.id}>
                      <div>{activity.message}</div>
                      <small>
                        {activity.actor?.name || "Unknown"} • {new Date(activity.createdAt).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
