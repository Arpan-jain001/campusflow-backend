// src/routes/assignmentSubmission.routes.js
const express = require("express");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Assignment = require("../models/Assignment");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

/**
 * STUDENT: submit / update own assignment URL
 * POST /api/assignment-submissions/:assignmentId
 */
router.post("/:assignmentId", auth, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only students can submit" });
    }

    const { assignmentId } = req.params;
    const { url, note } = req.body;

    if (!url?.trim()) {
      return res.status(400).json({ message: "Submission URL is required" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // upsert: agar pehle se submit kiya hai to update karo
    const submission = await AssignmentSubmission.findOneAndUpdate(
      {
        assignment: assignmentId,
        student: req.user._id,
      },
      {
        url: url.trim(),
        note: note?.trim() || "",
      },
      { new: true, upsert: true }
    );

    return res.status(200).json(submission);
  } catch (err) {
    console.error("Student submit assignment error", err);
    return res.status(500).json({ message: "Could not submit assignment" });
  }
});

/**
 * ADMIN: list of submitted students for one assignment
 * GET /api/assignment-submissions/:assignmentId/submitted
 */
router.get("/:assignmentId/submitted", auth, requireAdmin, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const subs = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate("student", "name rollNumber email")
      .sort({ createdAt: -1 });

    return res.json(subs);
  } catch (err) {
    console.error("Assignment submitted list error", err);
    return res.status(500).json({ message: "Could not load submitted list" });
  }
});

module.exports = router;
