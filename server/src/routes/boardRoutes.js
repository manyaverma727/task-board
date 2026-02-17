import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { Board } from "../models/Board.js";
import { BoardMember } from "../models/BoardMember.js";
import { List } from "../models/List.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { logActivity, emitBoardEvent } from "../utils/activity.js";
import { isValidObjectId, requireBoardMember } from "../utils/boardAccess.js";
import { parsePagination, toPageResponse } from "../utils/pagination.js";

function buildBoardRouter(io) {
  const router = express.Router();

  router.use(requireAuth);

  async function assertMember(boardId, userId) {
    if (!isValidObjectId(boardId)) {
      const err = new Error("Invalid boardId");
      err.status = 400;
      throw err;
    }

    const membership = await requireBoardMember(boardId, userId);
    if (!membership) {
      const err = new Error("Board access denied");
      err.status = 403;
      throw err;
    }

    return membership;
  }

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const memberships = await BoardMember.find({ userId: req.user.id }).lean();
      const boardIds = memberships.map((m) => m.boardId);

      const boards = await Board.find({ _id: { $in: boardIds } })
        .sort({ updatedAt: -1 })
        .lean();

      const roleByBoardId = new Map(
        memberships.map((m) => [m.boardId.toString(), m.role])
      );

      const items = boards.map((board) => ({
        id: board._id,
        title: board.title,
        description: board.description,
        role: roleByBoardId.get(board._id.toString()) || "member",
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      }));

      return res.json({ items });
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const { title, description } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ message: "Board title is required" });
      }

      const board = await Board.create({
        title: title.trim(),
        description: description?.trim() || "",
        ownerId: req.user.id,
      });

      await BoardMember.create({
        boardId: board._id,
        userId: req.user.id,
        role: "owner",
      });

      const defaultLists = ["To Do", "In Progress", "Done"];
      await Promise.all(
        defaultLists.map((name, index) =>
          List.create({
            boardId: board._id,
            title: name,
            position: (index + 1) * 1000,
          })
        )
      );

      await logActivity({
        boardId: board._id,
        actorId: req.user.id,
        type: "board.created",
        message: `Created board \"${board.title}\"`,
      });

      return res.status(201).json({
        board: {
          id: board._id,
          title: board.title,
          description: board.description,
          role: "owner",
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
        },
      });
    })
  );

  router.get(
    "/:boardId",
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      await assertMember(boardId, req.user.id);

      const board = await Board.findById(boardId).lean();
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const lists = await List.find({ boardId }).sort({ position: 1 }).lean();

      return res.json({
        board: {
          id: board._id,
          title: board.title,
          description: board.description,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
        },
        lists: lists.map((list) => ({
          id: list._id,
          boardId: list.boardId,
          title: list.title,
          position: list.position,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        })),
      });
    })
  );

  router.post(
    "/:boardId/lists",
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      const { title, position } = req.body;

      await assertMember(boardId, req.user.id);

      if (!title?.trim()) {
        return res.status(400).json({ message: "List title is required" });
      }

      const fallbackPosition = Date.now();
      const list = await List.create({
        boardId,
        title: title.trim(),
        position: Number.isFinite(Number(position)) ? Number(position) : fallbackPosition,
      });

      await logActivity({
        boardId,
        actorId: req.user.id,
        type: "list.created",
        message: `Created list \"${list.title}\"`,
        meta: { listId: list._id.toString() },
      });

      emitBoardEvent(io, boardId, "list.created", {
        list: {
          id: list._id,
          boardId: list.boardId,
          title: list.title,
          position: list.position,
        },
      });

      return res.status(201).json({
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

  router.get(
    "/:boardId/tasks",
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      const { search, listId } = req.query;

      await assertMember(boardId, req.user.id);

      const { page, limit, skip } = parsePagination(req.query);

      const filter = { boardId };

      if (listId) {
        if (!isValidObjectId(String(listId))) {
          return res.status(400).json({ message: "Invalid listId" });
        }
        filter.listId = String(listId);
      }

      if (search?.trim()) {
        filter.$or = [
          { title: { $regex: search.trim(), $options: "i" } },
          { description: { $regex: search.trim(), $options: "i" } },
        ];
      }

      const [total, tasks] = await Promise.all([
        Task.countDocuments(filter),
        Task.find(filter)
          .sort({ listId: 1, position: 1, updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("assigneeIds", "_id name email")
          .lean(),
      ]);

      return res.json(
        toPageResponse({
          items: tasks.map((task) => ({
            id: task._id,
            boardId: task.boardId,
            listId: task.listId,
            title: task.title,
            description: task.description,
            assignees: (task.assigneeIds || []).map((u) => ({
              id: u._id,
              name: u.name,
              email: u.email,
            })),
            position: task.position,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          })),
          total,
          page,
          limit,
        })
      );
    })
  );

  router.get(
    "/:boardId/members",
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      await assertMember(boardId, req.user.id);

      const memberships = await BoardMember.find({ boardId })
        .populate("userId", "_id name email")
        .lean();

      return res.json({
        items: memberships.map((m) => ({
          id: m._id,
          role: m.role,
          user: {
            id: m.userId?._id,
            name: m.userId?.name,
            email: m.userId?.email,
          },
        })),
      });
    })
  );

  router.post(
    "/:boardId/members",
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      const { email } = req.body;

      const actorMembership = await assertMember(boardId, req.user.id);

      if (actorMembership.role !== "owner") {
        return res.status(403).json({ message: "Only board owner can add members" });
      }

      if (!email?.trim()) {
        return res.status(400).json({ message: "email is required" });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(404).json({ message: "User not found for this email" });
      }

      const existing = await BoardMember.findOne({ boardId, userId: user._id });
      if (existing) {
        return res.status(200).json({ message: "User already in board" });
      }

      const membership = await BoardMember.create({
        boardId,
        userId: user._id,
        role: "member",
      });

      await logActivity({
        boardId,
        actorId: req.user.id,
        type: "board.member_added",
        message: `Added ${user.email} to board`,
        meta: { userId: user._id.toString() },
      });

      emitBoardEvent(io, boardId, "member.added", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });

      return res.status(201).json({
        membership: {
          id: membership._id,
          boardId: membership.boardId,
          userId: membership.userId,
          role: membership.role,
        },
      });
    })
  );

  router.get(
    "/:boardId/activities",
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      await assertMember(boardId, req.user.id);

      const { page, limit, skip } = parsePagination(req.query);

      const [total, activities] = await Promise.all([
        Activity.countDocuments({ boardId }),
        Activity.find({ boardId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("actorId", "_id name email")
          .lean(),
      ]);

      return res.json(
        toPageResponse({
          items: activities.map((a) => ({
            id: a._id,
            type: a.type,
            message: a.message,
            meta: a.meta,
            actor: {
              id: a.actorId?._id,
              name: a.actorId?.name,
              email: a.actorId?.email,
            },
            createdAt: a.createdAt,
          })),
          total,
          page,
          limit,
        })
      );
    })
  );

  return router;
}

export { buildBoardRouter };
