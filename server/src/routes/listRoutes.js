import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { List } from "../models/List.js";
import { Task } from "../models/Task.js";
import { logActivity, emitBoardEvent } from "../utils/activity.js";
import { isValidObjectId, requireBoardMember } from "../utils/boardAccess.js";

function buildListRouter(io) {
  const router = express.Router();

  router.use(requireAuth);

  async function loadListAndMember(listId, userId) {
    if (!isValidObjectId(listId)) {
      const err = new Error("Invalid listId");
      err.status = 400;
      throw err;
    }

    const list = await List.findById(listId);
    if (!list) {
      const err = new Error("List not found");
      err.status = 404;
      throw err;
    }

    const membership = await requireBoardMember(list.boardId, userId);
    if (!membership) {
      const err = new Error("Board access denied");
      err.status = 403;
      throw err;
    }

    return { list, membership };
  }

  router.post(
    "/:listId/tasks",
    asyncHandler(async (req, res) => {
      const { listId } = req.params;
      const { title, description } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ message: "Task title is required" });
      }

      const { list } = await loadListAndMember(listId, req.user.id);

      const lastTask = await Task.findOne({ listId: list._id }).sort({ position: -1 });
      const nextPosition = lastTask ? lastTask.position + 1000 : 1000;

      const task = await Task.create({
        boardId: list.boardId,
        listId: list._id,
        title: title.trim(),
        description: description?.trim() || "",
        assigneeIds: [],
        position: nextPosition,
      });

      await logActivity({
        boardId: list.boardId,
        actorId: req.user.id,
        type: "task.created",
        message: `Created task \"${task.title}\"`,
        meta: {
          taskId: task._id.toString(),
          listId: list._id.toString(),
        },
      });

      emitBoardEvent(io, list.boardId.toString(), "task.created", {
        task: {
          id: task._id,
          boardId: task.boardId,
          listId: task.listId,
          title: task.title,
          description: task.description,
          assignees: [],
          position: task.position,
        },
      });

      return res.status(201).json({
        task: {
          id: task._id,
          boardId: task.boardId,
          listId: task.listId,
          title: task.title,
          description: task.description,
          assignees: [],
          position: task.position,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    })
  );

  router.patch(
    "/:listId",
    asyncHandler(async (req, res) => {
      const { listId } = req.params;
      const { title, position } = req.body;

      const { list } = await loadListAndMember(listId, req.user.id);

      if (typeof title === "string" && title.trim()) {
        list.title = title.trim();
      }

      if (Number.isFinite(Number(position))) {
        list.position = Number(position);
      }

      await list.save();

      await logActivity({
        boardId: list.boardId,
        actorId: req.user.id,
        type: "list.updated",
        message: `Updated list \"${list.title}\"`,
        meta: {
          listId: list._id.toString(),
        },
      });

      emitBoardEvent(io, list.boardId.toString(), "list.updated", {
        list: {
          id: list._id,
          boardId: list.boardId,
          title: list.title,
          position: list.position,
        },
      });

      return res.json({
        list: {
          id: list._id,
          boardId: list.boardId,
          title: list.title,
          position: list.position,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        },
      });
    })
  );

  router.delete(
    "/:listId",
    asyncHandler(async (req, res) => {
      const { listId } = req.params;
      const { list } = await loadListAndMember(listId, req.user.id);

      await Task.deleteMany({ listId: list._id });
      await List.deleteOne({ _id: list._id });

      await logActivity({
        boardId: list.boardId,
        actorId: req.user.id,
        type: "list.deleted",
        message: `Deleted list \"${list.title}\"`,
        meta: {
          listId: list._id.toString(),
        },
      });

      emitBoardEvent(io, list.boardId.toString(), "list.deleted", {
        listId: list._id,
      });

      return res.status(204).send();
    })
  );

  return router;
}

export { buildListRouter };
