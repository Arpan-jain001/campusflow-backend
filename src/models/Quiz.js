const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    kind: {
      type: String,
      enum: ["mcq", "theory", "coding"],
      default: "mcq",
    },
    options: [String],
    correctOptionIndex: Number,
    language: {
      type: String,
      enum: [
        "html",
        "css",
        "javascript",
        "c",
        "cpp",
        "java",
        "python",
        "other",
      ],
      default: "javascript",
    },
    marks: { type: Number, default: 1 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    subject: String,
    questions: [questionSchema],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
