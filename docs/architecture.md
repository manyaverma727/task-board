# Architecture

## Backend (Node.js + Express + MongoDB)

- **Auth**: JWT-based signup/login with `bcryptjs` password hashing.
- **Core resources**:
  - Boards
  - Lists
  - Tasks
  - Board members
  - Activities
- **Access control**:
  - Every board-scoped endpoint checks membership.
  - Only board owner can add members.
- **Real-time layer**:
  - Socket.IO room per board (`board:<boardId>`).
  - Any create/update/delete/move/assign action emits `board:event`.
- **Search + pagination**:
  - `GET /boards/:boardId/tasks` supports `search`, `page`, `limit`.
  - `GET /boards/:boardId/activities` supports `page`, `limit`.

### Backend folder shape

- `src/models`: Mongoose models
- `src/routes`: feature routes
- `src/middleware`: auth and error handling
- `src/utils`: pagination, activity logger, helpers

## Frontend (React + Vite + TypeScript)

- **React Query** for server state:
  - boards, board detail, tasks, members, activities
  - mutations + query invalidation for consistency
- **Zustand** for app/UI state:
  - auth token + user
  - selected board
  - task search text and page
- **UI modules**:
  - `AuthPanel`
  - `BoardSidebar`
  - `ListColumn` (includes task cards and drag/drop)
- **Realtime sync**:
  - Socket connection joins current board room
  - on incoming `board:event`, invalidate relevant queries

## Why React Query + Zustand together

- **React Query** solves API data lifecycle (fetch/cache/refetch/mutations).
- **Zustand** solves local/global UI state without boilerplate reducers.
- This split keeps code clear and avoids mixing server state with UI control state.
