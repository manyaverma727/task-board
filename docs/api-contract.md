# API Contract

Base URL: `http://localhost:4000/api`

Auth header for protected routes:

`Authorization: Bearer <jwt>`

## Auth

- `POST /auth/signup`
  - body: `{ "name": "...", "email": "...", "password": "..." }`
  - returns: `{ token, user }`

- `POST /auth/login`
  - body: `{ "email": "...", "password": "..." }`
  - returns: `{ token, user }`

- `GET /auth/me`
  - returns: `{ user }`

## Boards

- `GET /boards`
  - returns: `{ items: BoardSummary[] }`

- `POST /boards`
  - body: `{ "title": "...", "description": "..." }`
  - returns: `{ board }`

- `GET /boards/:boardId`
  - returns: `{ board, lists }`

- `POST /boards/:boardId/lists`
  - body: `{ "title": "...", "position": 1000 }`
  - returns: `{ list }`

## Tasks

- `GET /boards/:boardId/tasks?search=&page=1&limit=50`
  - returns paginated task list

- `POST /lists/:listId/tasks`
  - body: `{ "title": "...", "description": "..." }`
  - returns: `{ task }`

- `PATCH /tasks/:taskId`
  - body: `{ "title": "...", "description": "..." }`
  - returns: `{ task }`

- `POST /tasks/:taskId/move`
  - body: `{ "targetListId": "...", "targetPosition": 12345 }`
  - returns: `{ task }`

- `POST /tasks/:taskId/assign`
  - body: `{ "assigneeIds": ["userId1"] }`
  - returns: `{ task }`

- `DELETE /tasks/:taskId`
  - returns: `204`

## Members

- `GET /boards/:boardId/members`
  - returns member list

- `POST /boards/:boardId/members`
  - body: `{ "email": "member@example.com" }`
  - owner-only

## Activity

- `GET /boards/:boardId/activities?page=1&limit=20`
  - returns paginated activity feed

## Lists

- `PATCH /lists/:listId`
  - body: `{ "title": "...", "position": 2000 }`
  - returns: `{ list }`

- `DELETE /lists/:listId`
  - returns: `204`
