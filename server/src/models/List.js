import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
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

listSchema.index({ boardId: 1, position: 1 });

export const List = mongoose.model("List", listSchema);
