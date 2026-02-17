# Scalability Considerations

## API and server layer

- Keep API stateless so multiple backend instances can be scaled horizontally behind a load balancer.
- JWT auth avoids sticky session dependency for request authentication.
- Add request rate limiting on auth routes to protect against brute-force traffic.

## Socket.IO real-time layer

- In single-node mode, rooms are in-memory and sufficient for local/interview use.
- For multi-node production, use Socket.IO Redis adapter so board room events broadcast across all instances.
- Keep event payloads compact (IDs + minimal fields), and let clients refetch key queries when needed.

## Database layer (MongoDB)

- Existing indexes improve read performance for high-frequency queries:
  - `users.email` unique
  - `board_members(boardId, userId)` unique
  - `lists(boardId, position)`
  - `tasks(boardId, listId, position)`
  - `activities(boardId, createdAt desc)`
- Prefer cursor-based pagination for very large datasets; current page/limit is acceptable for MVP scale.
- Consider TTL or archival policy for old activity records in long-lived boards.

## Caching strategy

- Use React Query client caching on frontend for lower repeated API calls.
- Introduce server-side cache (Redis) for hot board metadata and membership checks when traffic grows.

## Background jobs

- Move non-critical writes (analytics, notifications, audit fan-out) to a queue worker.
- Keep synchronous API path focused on user-visible state changes.

## Deployment and observability

- Run backend and DB in separate services/containers.
- Add health checks (`/api/health`), structured logs, and error monitoring.
- Track p95 latency, socket connection count, failed auth rate, and DB query durations.
