const express = require("express");
const Quiz = require("../models/Quiz");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/sendPush");

const router = express.Router();

// ADMIN: create quiz
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { assignedTo, ...quizData } = req.body;
    const isPrivate = !!assignedTo;

    const quiz = await Quiz.create({
      ...quizData,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      isPrivate,
    });

    // 🔔 PUSH NOTIFICATION
    try {
      let users;
      if (assignedTo) {
        // private quiz -> sirf ek student
        users = await User.find({
          _id: assignedTo,
          pushToken: { $ne: null },
        }).select("pushToken");
      } else {
        // global quiz -> sab active students
        users = await User.find({
          role: "user",
          status: "active",
          pushToken: { $ne: null },
        }).select("pushToken");
      }

      const tokens = users.map((u) => u.pushToken);
      if (tokens.length) {
        await sendPushNotification(
          tokens,
          "New Quiz Available",
          quiz.title || "A new quiz has been published.",
          { kind: "quiz", quizId: quiz._id.toString() }
        );
      }
    } catch (pushErr) {
      console.error("Quiz push error:", pushErr);
      // notification fail ho jaye to bhi quiz create rahega
    }

    res.json(quiz);
  } catch (err) {
    console.error("Create quiz error", err);
    res.status(500).json({ message: "Could not create quiz" });
  }
});

// बाकी routes SAME रहेंगे
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json(quiz);
  } catch (err) {
    console.error("Update quiz error", err);
    res.status(500).json({ message: "Could not update quiz" });
  }
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete quiz error", err);
    res.status(500).json({ message: "Could not delete quiz" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    let query;
    if (req.user.role === "admin") {
      query = Quiz.find();
    } else {
      query = Quiz.find({
        $or: [{ isPrivate: false }, { assignedTo: req.user._id }],
      });
    }
    const list = await query.sort({ startTime: 1 });
    res.json(list);
  } catch (err) {
    console.error("List quizzes error", err);
    res.status(500).json({ message: "Could not load quizzes" });
  }
});

router.get("/:id", auth, async (req, res) => {
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
        return res
          .status(403)
          .json({ message: "You don't have access to this quiz" });
      }
    }
    res.json(quiz);
  } catch (err) {
    console.error("Get quiz error", err);
    res.status(500).json({ message: "Could not load quiz" });
  }
});

module.exports = router;
