# Database Schema (MongoDB)

```mermaid
erDiagram
    USERS ||--o{ BOARD_MEMBERS : "joins"
    BOARDS ||--o{ BOARD_MEMBERS : "has"
    BOARDS ||--o{ LISTS : "contains"
    LISTS ||--o{ TASKS : "contains"
    BOARDS ||--o{ TASKS : "contains"
    BOARDS ||--o{ ACTIVITIES : "records"
    USERS ||--o{ ACTIVITIES : "performs"

    USERS {
      ObjectId _id
      string name
      string email UNIQUE
      string passwordHash
      date createdAt
      date updatedAt
    }

    BOARDS {
      ObjectId _id
      string title
      string description
      ObjectId ownerId
      date createdAt
      date updatedAt
    }

    BOARD_MEMBERS {
      ObjectId _id
      ObjectId boardId
      ObjectId userId
      string role
      date createdAt
      date updatedAt
    }

    LISTS {
      ObjectId _id
      ObjectId boardId
      string title
      number position
      date createdAt
      date updatedAt
    }

    TASKS {
      ObjectId _id
      ObjectId boardId
      ObjectId listId
      string title
      string description
      ObjectId[] assigneeIds
      number position
      date createdAt
      date updatedAt
    }

    ACTIVITIES {
      ObjectId _id
      ObjectId boardId
      ObjectId actorId
      string type
      string message
      mixed meta
      date createdAt
      date updatedAt
    }
```

## Key indexes

- `users.email` unique
- `board_members (boardId, userId)` unique
- `lists (boardId, position)`
- `tasks (boardId, listId, position)`
- `activities (boardId, createdAt desc)`
