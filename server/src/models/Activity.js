import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      maxlength: 64,
    },
    message: {
      type: String,
      required: true,
      maxlength: 300,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activitySchema.index({ boardId: 1, createdAt: -1 });

export const Activity = mongoose.model("Activity", activitySchema);
