import { useState } from "react";
import type { BoardSummary } from "../types";

interface BoardSidebarProps {
  boards: BoardSummary[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (payload: { title: string; description: string }) => void;
  creating: boolean;
}

export function BoardSidebar({
  boards,
  selectedBoardId,
  onSelectBoard,
  onCreateBoard,
  creating,
}: BoardSidebarProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <aside className="sidebar">
      <h2>Boards</h2>

      <div className="board-list">
        {boards.map((board) => (
          <button
            key={board.id}
            className={selectedBoardId === board.id ? "board-item active" : "board-item"}
            onClick={() => onSelectBoard(board.id)}
          >
            <strong>{board.title}</strong>
            <span>{board.role}</span>
          </button>
        ))}
      </div>

      <form
        className="board-create"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateBoard({ title, description });
          setTitle("");
          setDescription("");
        }}
      >
        <h3>Create board</h3>
        <input
          placeholder="Board title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create"}
        </button>
      </form>
    </aside>
  );
}
