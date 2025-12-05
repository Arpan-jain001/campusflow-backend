const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionIndex: Number,
    selectedOptionIndex: Number,
    isCorrect: Boolean,
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    incorrectCount: { type: Number, required: true },
    notAttemptedCount: { type: Number, required: true },
    answers: [answerSchema],

    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "submitted",
    },
    startedAt: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizResult", quizResultSchema);
