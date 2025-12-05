// src/models/Slot.js
const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    date: {
      type: String, // "2025-12-05" (YYYY-MM-DD)
      required: true,
      index: true,
    },
    startTime: {
      type: String, // "10:00"
      required: true,
    },
    endTime: {
      type: String, // "10:30"
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ek din me ek hi same start-end slot ho
slotSchema.index({ date: 1, startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema);
