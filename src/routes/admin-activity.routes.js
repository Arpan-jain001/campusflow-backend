const express = require("express");
const auth = require("../middleware/auth.middleware");
const Activity = require("../models/Activity");
const User = require("../models/User"); // agar needed ho

const router = express.Router();

function isAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admin access only" });
}

// GET /api/admin/activity  -> audit log
router.get("/activity", auth, isAdmin, async (req, res) => {
  try {
    const items = await Activity.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name rollNumber email")
      .populate("actor", "name role");

    return res.json(items);
  } catch (err) {
    console.error("Admin get activity error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/admin/activity/broadcast  -> global announcement
router.post("/activity/broadcast", auth, isAdmin, async (req, res) => {
  try {
    const actorId = req.user.id;
    const { title, message } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // sab active students (ya jo bhi filter chahiye)
    const users = await User.find({ role: "user" }).select("_id");

    if (!users.length) {
      return res.status(400).json({ message: "No students found to notify" });
    }

    const docs = users.map((u) => ({
      user: u._id,
      actor: actorId,
      type: "system",
      verb: "announcement",
      title: title.trim(),
      message: message?.trim() || "",
      entityId: null,
      typeRef: null,
    }));

    const created = await Activity.insertMany(docs);

    return res.status(201).json({ count: created.length });
  } catch (err) {
    console.error("Admin broadcast activity error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
