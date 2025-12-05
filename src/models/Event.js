// src/models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["exam", "assignment", "meetup", "other"],
      default: "other",
    },
    dateTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // naya: user personal vs admin global
    visibility: {
      type: String,
      enum: ["user", "global"],
      default: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
