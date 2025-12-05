const express = require("express");
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// ADMIN: list all quizzes
router.get("/admin", auth, requireAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ startTime: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error("admin quiz list error", err);
    res.status(500).json({ message: "Could not load quizzes" });
  }
});

// ADMIN: live monitor one quiz
router.get("/:id/admin-monitor", auth, requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const results = await QuizResult.find({ quiz: quiz._id })
      .populate("user", "name rollNumber email")
      .sort({ createdAt: -1 });

    const inProgress = results.filter((r) => r.status === "in_progress");
    const submitted = results.filter((r) => r.status === "submitted");

    res.json({
      quiz,
      stats: {
        totalResults: results.length,
        inProgressCount: inProgress.length,
        submittedCount: submitted.length,
      },
      inProgress,
      submitted,
    });
  } catch (err) {
    console.error("admin quiz monitor error", err);
    res.status(500).json({ message: "Could not load monitor data" });
  }
});

module.exports = router;
