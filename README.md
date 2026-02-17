# Real-Time Task Collaboration Platform

Interview assignment implementation for a lightweight Trello/Notion-style board app.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Real-time: Socket.IO
- Server state: React Query
- UI/App state: Zustand

## Why React Query and Zustand

- **React Query** manages server data (fetching, caching, refetching, mutation invalidation) for boards/lists/tasks/members/activity.
- **Zustand** manages lightweight global UI/app state (auth session, selected board, search text, pagination index).
- Using both keeps responsibilities clear and avoids overloading one state tool.

## Features Implemented

- Signup/login with JWT auth
- Create boards with default lists
- Create/update/delete tasks
- Drag-and-drop task movement across lists
- Assign users to tasks
- Real-time update sync across users on the same board
- Activity history logging
- Search and pagination for tasks
- Pagination for activity feed
- Basic backend test coverage (`pagination` utility tests)
- Deployment-ready code structure and environment config

## Project Structure

- `/server`: Express API + Socket.IO + MongoDB models
- `/client`: React SPA
- `/docs`: architecture, schema, API contract, real-time strategy

## Local Setup

## 1. Prerequisites

- Node.js 20+
- npm 10+
- MongoDB running locally

## 2. Install dependencies

```bash
npm install
```

## 3. Configure backend env

```bash
cp server/.env.example server/.env
```

Update `server/.env` values if needed.

## 4. Seed demo data (optional, recommended)

```bash
npm run seed --workspace server
```

Demo credentials:

- `owner@demo.com / demo1234`
- `member@demo.com / demo1234`

## 5. Run both apps

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Documentation

- Architecture: `/docs/architecture.md`
- Database schema: `/docs/db-schema.md`
- API contract: `/docs/api-contract.md`
- Real-time strategy: `/docs/realtime-strategy.md`
- Scalability considerations: `/docs/scalability.md`
- Deployment guide: `/docs/deployment.md`

## Trade-offs / Assumptions

- Prioritized clean MVP over advanced RBAC and optimistic UI.
- Task pagination is board-level (not independent pagination per list).
- Drag-drop currently updates list + position with simple numeric ordering.
- Real-time strategy uses query invalidation for correctness over complex local patching.

## What I would improve next

- Add optimistic updates for drag-drop so movement feels instant.
- Add richer board roles/permissions (owner/editor/viewer).
- Move Socket.IO scaling to Redis adapter for multi-instance deployments.
- Add E2E tests for key flows (auth, move task, assignment, activity logging).
