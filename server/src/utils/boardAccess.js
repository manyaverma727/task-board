import mongoose from "mongoose";
import { BoardMember } from "../models/BoardMember.js";

export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export async function requireBoardMember(boardId, userId) {
  return BoardMember.findOne({ boardId, userId });
}
