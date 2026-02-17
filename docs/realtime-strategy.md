# Real-Time Sync Strategy

## Transport

- Socket.IO over WebSocket fallback stack.
- Authenticated via JWT in socket handshake.

## Room model

- A room per board: `board:<boardId>`.
- Client emits `board:join` after selecting board.

## Event model

Server emits:

- `board:event`
  - payload: `{ event, payload, at }`

Typical `event` values:

- `task.created`
- `task.updated`
- `task.deleted`
- `task.moved`
- `task.assigned`
- `list.created`
- `list.updated`
- `list.deleted`
- `member.added`

## Frontend sync behavior

- On `board:event`, frontend invalidates related React Query keys:
  - board detail
  - board tasks
  - board members
  - board activities
  - board list sidebar
- This keeps data eventually consistent across clients while keeping client logic simple.
