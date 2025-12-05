// src/models/AssignmentSubmission.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: true, // student ka submitted assignment URL
      trim: true,
    },
    note: String, // optional remark by student
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssignmentSubmission", submissionSchema);
