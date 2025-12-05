// src/routes/adminUser.routes.js
const express = require("express");
const User = require("../models/User");
const Task = require("../models/Task");
const Note = require("../models/Note");
const Event = require("../models/Event");
const Assignment = require("../models/Assignment");
const QuizResult = require("../models/QuizResult");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// GET /api/admin/users  -> basic list
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find(
      { role: "user" },
      { name: 1, rollNumber: 1, email: 1 }
    ).sort({ rollNumber: 1 });

    res.json(users);
  } catch (err) {
    console.error("admin users list error", err);
    res.status(500).json({ message: "Could not load users" });
  }
});

// GET /api/admin/users/:id  -> full detail + counts
router.get("/users/:id", auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId, {
      name: 1,
      email: 1,
      rollNumber: 1,
      degree: 1,
      branch: 1,
      year: 1,
      createdAt: 1,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [tasksCount, notesCount, eventsCount, assignmentsCount, quizResults] =
      await Promise.all([
        Task.countDocuments({ user: userId }),
        Note.countDocuments({ user: userId }),
        Event.countDocuments({ user: userId }),
        Assignment.countDocuments({ assignedTo: userId }), // ya jo field tum use kar rahe ho
        QuizResult.find({ user: userId }).populate("quiz", "title startTime"),
      ]);

    res.json({
      user,
      stats: {
        tasksCount,
        notesCount,
        eventsCount,
        assignmentsCount,
        quizzesAttempted: quizResults.length,
      },
      quizResults,
    });
  } catch (err) {
    console.error("admin user detail error", err);
    res.status(500).json({ message: "Could not load user details" });
  }
});

module.exports = router;
