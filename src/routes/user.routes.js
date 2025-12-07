// E:\CampusFlow\campusflow-backend\src\routes\user.routes.js
const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");

const router = express.Router();

/**
 * GET /api/users/me
 * Logged-in user ka profile
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Could not load profile" });
  }
});

/**
 * PATCH /api/users/me
 * Logged-in user apne basic fields update kare
 */
router.patch("/me", auth, async (req, res) => {
  try {
    const allowed = ["name", "dob", "degree", "branch", "year", "college"];
    const patch = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, patch, {
      new: true,
    }).select("-passwordHash");

    res.json(user);
  } catch (err) {
    console.error("Update me error:", err);
    res.status(500).json({ message: "Could not update profile" });
  }
});

/**
 * ADMIN: list all users
 * GET /api/users
 */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json(users);
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ message: "Could not load users" });
  }
});

/**
 * ADMIN: update user status/role
 * PATCH /api/users/:id
 */
router.patch("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const allowed = ["status", "role", "name"];
    const patch = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.params.id, patch, {
      new: true,
    }).select("-passwordHash");

    res.json(user);
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ message: "Could not update user" });
  }
});

module.exports = router;
