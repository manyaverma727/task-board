import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Task } from "../models/Task.js";
import { List } from "../models/List.js";
import { User } from "../models/User.js";
import { BoardMember } from "../models/BoardMember.js";
import { logActivity, emitBoardEvent } from "../utils/activity.js";
import { isValidObjectId, requireBoardMember } from "../utils/boardAccess.js";

function buildTaskRouter(io) {
  const router = express.Router();

  router.use(requireAuth);

  async function loadTaskAndMember(taskId, userId) {
    if (!isValidObjectId(taskId)) {
      const err = new Error("Invalid taskId");
      err.status = 400;
      throw err;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      const err = new Error("Task not found");
      err.status = 404;
      throw err;
    }

    const membership = await requireBoardMember(task.boardId, userId);
    if (!membership) {
      const err = new Error("Board access denied");
      err.status = 403;
      throw err;
    }

    return { task, membership };
  }

  router.patch(
    "/:taskId",
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      const { title, description } = req.body;

      const { task } = await loadTaskAndMember(taskId, req.user.id);

      if (typeof title === "string" && title.trim()) {
        task.title = title.trim();
      }

      if (typeof description === "string") {
        task.description = description.trim();
      }

      await task.save();

      await logActivity({
        boardId: task.boardId,
        actorId: req.user.id,
        type: "task.updated",
        message: `Updated task \"${task.title}\"`,
        meta: { taskId: task._id.toString() },
      });

      emitBoardEvent(io, task.boardId.toString(), "task.updated", {
        task: {
          id: task._id,
          boardId: task.boardId,
          listId: task.listId,
          title: task.title,
          description: task.description,
          assigneeIds: task.assigneeIds,
          position: task.position,
        },
      });

      return res.json({
        task: {
          id: task._id,
          boardId: task.boardId,
          listId: task.listId,
          title: task.title,
          description: task.description,
          assigneeIds: task.assigneeIds,
          position: task.position,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    })
  );

  router.post(
    "/:taskId/move",
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      const { targetListId, targetPosition } = req.body;

      if (!targetListId || !isValidObjectId(targetListId)) {
        return res.status(400).json({ message: "Valid targetListId is required" });
      }

      const { task } = await loadTaskAndMember(taskId, req.user.id);

      const targetList = await List.findById(targetListId);
      if (!targetList) {
        return res.status(404).json({ message: "Target list not found" });
      }

      if (targetList.boardId.toString() !== task.boardId.toString()) {
        return res
          .status(400)
          .json({ message: "Target list must belong to the same board" });
      }

      task.listId = targetList._id;
      task.position = Number.isFinite(Number(targetPosition))
        ? Number(targetPosition)
        : Date.now();

      await task.save();

      await logActivity({
        boardId: task.boardId,
        actorId: req.user.id,
        type: "task.moved",
        message: `Moved task \"${task.title}\" to \"${targetList.title}\"`,
        meta: {
          taskId: task._id.toString(),
          listId: targetList._id.toString(),
        },
      });

      emitBoardEvent(io, task.boardId.toString(), "task.moved", {
        task: {
          id: task._id,
          boardId: task.boardId,
          listId: task.listId,
          title: task.title,
          description: task.description,
          assigneeIds: task.assigneeIds,
          position: task.position,
        },
      });

      return res.json({
        task: {
          id: task._id,
          boardId: task.boardId,
          listId: task.listId,
          title: task.title,
          description: task.description,
          assigneeIds: task.assigneeIds,
          position: task.position,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    })
  );

  router.post(
    "/:taskId/assign",
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      const { assigneeIds } = req.body;

      if (!Array.isArray(assigneeIds)) {
        return res.status(400).json({ message: "assigneeIds must be an array" });
      }

      const { task } = await loadTaskAndMember(taskId, req.user.id);

      const validIds = assigneeIds.filter((id) => isValidObjectId(id));
      const users = await User.find({ _id: { $in: validIds } }).select("_id").lean();
      const userIdSet = new Set(users.map((u) => u._id.toString()));

      const boardMemberships = await BoardMember.find({
        boardId: task.boardId,
        userId: { $in: [...userIdSet] },
      })
        .select("userId")
        .lean();

      const boardUserSet = new Set(boardMemberships.map((m) => m.userId.toString()));

      task.assigneeIds = validIds.filter((id) => boardUserSet.has(id));
      await task.save();

      await logActivity({
        boardId: task.boardId,
        actorId: req.user.id,
        type: "task.assigned",
        message: `Updated assignees for \"${task.title}\"`,
        meta: {
          taskId: task._id.toString(),
          assigneeIds: task.assigneeIds.map((id) => id.toString()),
        },
      });

      emitBoardEvent(io, task.boardId.toString(), "task.assigned", {
        task: {
          id: task._id,
          assigneeIds: task.assigneeIds,
        },
      });

      return res.json({
        task: {
          id: task._id,
          boardId: task.boardId,
          listId: task.listId,
          title: task.title,
          description: task.description,
          assigneeIds: task.assigneeIds,
          position: task.position,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    })
  );

  router.delete(
    "/:taskId",
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      const { task } = await loadTaskAndMember(taskId, req.user.id);

      await Task.deleteOne({ _id: task._id });

      await logActivity({
        boardId: task.boardId,
        actorId: req.user.id,
        type: "task.deleted",
        message: `Deleted task \"${task.title}\"`,
        meta: {
          taskId: task._id.toString(),
        },
      });

      emitBoardEvent(io, task.boardId.toString(), "task.deleted", {
        taskId: task._id,
        listId: task.listId,
      });

      return res.status(204).send();
    })
  );

  return router;
}

export { buildTaskRouter };
