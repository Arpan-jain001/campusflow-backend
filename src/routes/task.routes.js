// src/routes/task.routes.js
const express = require("express");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin");
const {
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  getGlobalTasks,
  createGlobalTask,
  createUserTask,
  getUserTasks,
} = require("../controllers/task.controller");

const router = express.Router();

// saare task routes protected hain
router.use(auth);

// ----------------------
// Student side (self)
// ----------------------

// GET /api/tasks -> current user ke tasks
router.get("/", getMyTasks);

// POST /api/tasks -> naya task create (self)
router.post("/", createTask);

// PATCH /api/tasks/:id -> update (status, title, etc.)
router.patch("/:id", updateTask);

// DELETE /api/tasks/:id -> delete task
router.delete("/:id", deleteTask);

// ----------------------
// Admin side
// ----------------------

// GET /api/tasks/global -> sab global tasks (admin only)
router.get("/global", requireAdmin, getGlobalTasks);

// POST /api/tasks/global -> ek global task jo sab students ko assign hoga
router.post("/global", requireAdmin, createGlobalTask);

// GET /api/tasks/user/:userId -> specific user ke saare tasks (admin only)
router.get("/user/:userId", requireAdmin, getUserTasks);

// POST /api/tasks/user/:userId -> admin create task for that specific user
router.post("/user/:userId", requireAdmin, createUserTask);

module.exports = router;
