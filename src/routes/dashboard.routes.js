const express = require("express");
const Task = require("../models/Task");
const Assignment = require("../models/Assignment");
const Quiz = require("../models/Quiz");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

function getTodayRange() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  return { start, end };
}

// GET /api/dashboard/stats
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { start, end } = getTodayRange();

    // Tasks (per user) – yahan field change karo: user → assignedTo
    const tasksToday = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $gte: start, $lte: end },
    });

    const tasksUpcoming = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $gt: end },
    });

    // Assignments – common
    const assignmentsToday = await Assignment.countDocuments({
      dueDate: { $gte: start, $lte: end },
    });

    const assignmentsUpcoming = await Assignment.countDocuments({
      dueDate: { $gt: end },
    });

    // Quizzes
    const quizzesToday = await Quiz.countDocuments({
      startTime: { $gte: start, $lte: end },
    });

    const quizzesUpcoming = await Quiz.countDocuments({
      startTime: { $gt: end },
    });

    return res.json({
      tasksToday,
      tasksUpcoming,
      assignmentsToday,
      assignmentsUpcoming,
      quizzesToday,
      quizzesUpcoming,
    });
  } catch (err) {
    console.error("dashboard stats error", err);
    return res
      .status(500)
      .json({ message: "Could not load dashboard stats" });
  }
});

module.exports = router;
