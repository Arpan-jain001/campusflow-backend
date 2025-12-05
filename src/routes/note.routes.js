// src/routes/note.routes.js
const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  getNotes,
  createNote,
  deleteNote,
} = require("../controllers/note.controller");
const Note = require("../models/Note");

const router = express.Router();

// Saare routes protected
router.use(auth);

// Simple admin guard
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// =====================================
// USER + ADMIN (self + global notes)
// Base mount example: app.use("/api/notes", router)
// =====================================

// GET /api/notes?q=title
router.get("/", getNotes);

// POST /api/notes
router.post("/", createNote);

// DELETE /api/notes/:id
router.delete("/:id", deleteNote);

// =====================================
// ADMIN ONLY – all notes
// Full path (agar mount: app.use("/api/notes", router))
// GET /api/notes/admin/notes
// =====================================

router.get("/admin/notes", requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = {};

    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email role");

    return res.json(notes);
  } catch (err) {
    console.error("Admin get all notes error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
