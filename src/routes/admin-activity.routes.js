const express = require("express");
const auth = require("../middleware/auth.middleware");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/sendPush");

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

// POST /api/admin/activity/broadcast -> global announcement + push
router.post("/activity/broadcast", auth, isAdmin, async (req, res) => {
  try {
    const actorId = req.user.id;
    const { title, message } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const users = await User.find({
      role: "user",
      status: "active",
    }).select("_id pushToken");

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

    // 🔔 PUSH
    try {
      const tokens = users
        .filter((u) => u.pushToken)
        .map((u) => u.pushToken);

      if (tokens.length) {
        await sendPushNotification(
          tokens,
          title.trim(),
          message?.trim() || "New campus announcement.",
          {
            kind: "activity",
            activityId: null, // broadcast
          }
        );
      }
    } catch (pushErr) {
      console.error("Activity broadcast push error:", pushErr);
    }

    return res.status(201).json({ count: created.length });
  } catch (err) {
    console.error("Admin broadcast activity error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
