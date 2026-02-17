import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    assigneeIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    position: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ boardId: 1, listId: 1, position: 1 });
taskSchema.index({ title: "text", description: "text" });

export const Task = mongoose.model("Task", taskSchema);
