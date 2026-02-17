import { useState } from "react";
import type { ListItem, Task, User } from "../types";

interface ListColumnProps {
  list: ListItem;
  tasks: Task[];
  members: User[];
  onCreateTask: (listId: string, payload: { title: string; description?: string }) => void;
  onMoveTask: (taskId: string, targetListId: string) => void;
  onUpdateTask: (taskId: string, payload: { title?: string; description?: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onAssignTask: (taskId: string, assigneeIds: string[]) => void;
}

function TaskCard({
  task,
  members,
  onUpdateTask,
  onDeleteTask,
  onAssignTask,
}: {
  task: Task;
  members: User[];
  onUpdateTask: (taskId: string, payload: { title?: string; description?: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onAssignTask: (taskId: string, assigneeIds: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const assignedId = task.assignees?.[0]?.id || "";

  return (
    <article
      className="task-card"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
      }}
    >
      {editing ? (
        <div className="task-edit">
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="task-actions">
            <button
              onClick={() => {
                onUpdateTask(task.id, { title, description });
                setEditing(false);
              }}
            >
              Save
            </button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h4>{task.title}</h4>
          <p>{task.description}</p>

          <div className="task-meta">
            <select
              value={assignedId}
              onChange={(event) => {
                const value = event.target.value;
                onAssignTask(task.id, value ? [value] : []);
              }}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

            <div className="task-actions">
              <button onClick={() => setEditing(true)}>Edit</button>
              <button className="danger" onClick={() => onDeleteTask(task.id)}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export function ListColumn({
  list,
  tasks,
  members,
  onCreateTask,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  onAssignTask,
}: ListColumnProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  return (
    <section
      className="list-column"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain");
        if (taskId) {
          onMoveTask(taskId, list.id);
        }
      }}
    >
      <header>
        <h3>{list.title}</h3>
        <span>{tasks.length} tasks</span>
      </header>

      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onAssignTask={onAssignTask}
          />
        ))}
      </div>

      <form
        className="task-create"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateTask(list.id, { title: taskTitle, description: taskDescription });
          setTaskTitle("");
          setTaskDescription("");
        }}
      >
        <input
          placeholder="New task title"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          required
        />
        <textarea
          placeholder="Task description"
          value={taskDescription}
          onChange={(event) => setTaskDescription(event.target.value)}
        />
        <button type="submit">Add task</button>
      </form>
    </section>
  );
}
