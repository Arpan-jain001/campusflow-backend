const express = require("express");
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// GET /api/quizzes/:id/attempt
router.get("/:id/attempt", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (req.user.role !== "admin") {
      const isAssignedToUser =
        quiz.assignedTo?.toString() === req.user._id.toString();
      const isGlobal = !quiz.isPrivate;
      if (!isGlobal && !isAssignedToUser) {
        return res.status(403).json({ message: "You don't have access to this quiz" });
      }
    }

    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(quiz.endTime);

    if (now < start) {
      return res.status(403).json({
        status: "UPCOMING",
        message: "Quiz has not started yet",
        startTime: quiz.startTime,
      });
    }

    if (now > end) {
      return res.status(403).json({
        status: "ENDED",
        message: "Quiz is over",
        endTime: quiz.endTime,
      });
    }

    let existing = await QuizResult.findOne({
      quiz: quiz._id,
      user: req.user._id,
    });

    if (!existing) {
      existing = await QuizResult.create({
        quiz: quiz._id,
        user: req.user._id,
        score: 0,
        totalQuestions: quiz.questions.length,
        correctCount: 0,
        incorrectCount: 0,
        notAttemptedCount: quiz.questions.length,
        answers: [],
        status: "in_progress",
        startedAt: now,
        submittedAt: null,
      });
    }

    res.json({
      quiz,
      existingResult: existing,
    });
  } catch (err) {
    console.error("quiz attempt load error", err);
    res.status(500).json({ message: "Could not load quiz" });
  }
});

// POST /api/quizzes/:id/submit
router.post("/:id/submit", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    if (req.user.role !== "admin") {
      const isAssignedToUser =
        quiz.assignedTo?.toString() === req.user._id.toString();
      const isGlobal = !quiz.isPrivate;
      if (!isGlobal && !isAssignedToUser) {
        return res.status(403).json({ message: "You don't have access to this quiz" });
      }
    }

    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(quiz.endTime);

    if (now < start) {
      return res.status(403).json({
        status: "UPCOMING",
        message: "Quiz has not started yet",
      });
    }

    if (now > end) {
      return res.status(403).json({
        status: "ENDED",
        message: "Quiz is over",
      });
    }

    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers array is required" });
    }

    const totalQuestions = quiz.questions.length;
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let notAttemptedCount = 0;
    const answerDetails = [];

    quiz.questions.forEach((q, idx) => {
      const selectedIndex =
        typeof answers[idx] === "number" ? answers[idx] : null;
      if (selectedIndex === null) {
        notAttemptedCount += 1;
        answerDetails.push({
          questionIndex: idx,
          selectedOptionIndex: -1,
          isCorrect: false,
        });
        return;
      }
      const isCorrect = selectedIndex === q.correctOptionIndex;
      if (isCorrect) {
        correctCount += 1;
        score += q.marks || 1;
      } else {
        incorrectCount += 1;
      }
      answerDetails.push({
        questionIndex: idx,
        selectedOptionIndex: selectedIndex,
        isCorrect,
      });
    });

    const resultPayload = {
      quiz: quiz._id,
      user: req.user._id,
      score,
      totalQuestions,
      correctCount,
      incorrectCount,
      notAttemptedCount,
      answers: answerDetails,
      status: "submitted",
      submittedAt: now,
    };

    let result = await QuizResult.findOne({
      quiz: quiz._id,
      user: req.user._id,
    });

    if (result) {
      result.set({
        ...resultPayload,
        startedAt: result.startedAt || now,
      });
      await result.save();
    } else {
      result = await QuizResult.create({
        ...resultPayload,
        startedAt: now,
      });
    }

    res.json({ ok: true, result });
  } catch (err) {
    console.error("quiz submit error", err);
    res.status(500).json({ message: "Could not submit quiz" });
  }
});

// GET /api/quizzes/:id/result
router.get("/:id/result", auth, async (req, res) => {
  try {
    const result = await QuizResult.findOne({
      quiz: req.params.id,
      user: req.user._id,
    }).populate("quiz");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (err) {
    console.error("quiz result error", err);
    res.status(500).json({ message: "Could not load result" });
  }
});

module.exports = router;
