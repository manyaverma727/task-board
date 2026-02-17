# Deployment Guide

This guide deploys:
- Backend (`/server`) on Render
- Frontend (`/client`) on Vercel
- Database on MongoDB Atlas

## 1) Create MongoDB Atlas database

1. Create an Atlas cluster.
2. Create a database user (username/password).
3. In Network Access, allow your hosting providers (for quick setup, `0.0.0.0/0`; tighten later).
4. Copy the connection string and set DB name to `task_collab`.

Example:

```text
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/task_collab?retryWrites=true&w=majority
```

## 2) Deploy backend on Render

Create a **Web Service** from your GitHub repo with:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Set environment variables:

- `PORT=10000` (or leave default Render port handling)
- `MONGODB_URI=<your atlas connection string>`
- `JWT_SECRET=<long-random-secret>`
- `CLIENT_ORIGIN=<your vercel frontend url>`

If needed, you can provide multiple origins (comma separated):

```text
CLIENT_ORIGIN=https://task-board.vercel.app,https://task-board-git-main-username.vercel.app
```

After deploy, note backend URL, e.g.:

```text
https://task-board-api.onrender.com
```

## 3) Deploy frontend on Vercel

Create a Vercel project from same repo with:

- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Set env var:

- `VITE_API_URL=https://task-board-api.onrender.com/api`

Redeploy after setting env vars.

## 4) Wire CORS and redeploy backend

Set backend `CLIENT_ORIGIN` to your final Vercel production URL and redeploy backend once.

## 5) Seed demo data (optional)

For production demo, either:
- sign up users from UI, or
- run seed once from backend environment shell:

```bash
npm run seed
```

(Only do this on a non-production demo DB, because it clears collections first.)

## 6) Verify

- Frontend loads and logs in
- Create board/list/task
- Drag task across lists
- Assign member
- Open second browser/tab and confirm real-time updates
- Confirm activity feed updates
