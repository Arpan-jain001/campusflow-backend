const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // jis user ke feed me dikhna hai
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // jisne action kiya (admin ya khud user)
    },
    type: {
      type: String,
      enum: ["task", "note", "event", "system"],
      required: true,
    },
    verb: {
      type: String,
      enum: ["created", "updated", "deleted", "uploaded", "announcement"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "typeRef",
    },
    typeRef: {
      type: String,
      enum: ["Task", "Note", "Event", null],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
