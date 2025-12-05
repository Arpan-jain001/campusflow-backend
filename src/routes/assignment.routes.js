const express = require("express");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/sendPush");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// admin: create assignment (global ya per-student)
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const body = req.body;

    const assignment = await Assignment.create({
      title: body.title,
      description: body.description,
      subject: body.subject,
      type: body.type || "theory",
      dueDate: body.dueDate,
      course: body.course,
      fileUrl: body.fileUrl,
      resourceLink: body.resourceLink,
      solutionUrl: body.solutionUrl, // usually blank at create time
      targetUserId: body.targetUserId || null,
      createdBy: req.user._id,
    });

    // 🔔 PUSH NOTIFICATION
    try {
      let users;
      if (body.targetUserId) {
        users = await User.find({
          _id: body.targetUserId,
          pushToken: { $ne: null },
        }).select("pushToken");
      } else {
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
          "New Assignment",
          assignment.title || "A new assignment has been posted.",
          { kind: "assignment", assignmentId: assignment._id.toString() }
        );
      }
    } catch (pushErr) {
      console.error("Assignment push error", pushErr);
    }

    res.json(assignment);
  } catch (err) {
    console.error("Create assignment error", err);
    res.status(500).json({ message: "Could not create assignment" });
  }
});

// बाकी routes SAME
router.put("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(assignment);
  } catch (err) {
    console.error("Update assignment error", err);
    res.status(500).json({ message: "Could not update assignment" });
  }
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete assignment error", err);
    res.status(500).json({ message: "Could not delete assignment" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const query = {};
    const list = await Assignment.find(query).sort({ dueDate: 1 });
    res.json(list);
  } catch (err) {
    console.error("List assignments error", err);
    res.status(500).json({ message: "Could not fetch assignments" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const item = await Assignment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("Get assignment detail error", err);
    res.status(500).json({ message: "Could not fetch assignment" });
  }
});

module.exports = router;
