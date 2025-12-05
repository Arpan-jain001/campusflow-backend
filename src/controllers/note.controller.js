// src/controllers/note.controller.js
const Note = require("../models/Note");

// GET /api/notes?q=ds
// user: apne notes + admin global notes
// admin: sab notes (same filter se cover ho jayega)
exports.getNotes = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const userId = req.user.id || req.user._id;

    const baseFilter = {
      $or: [
        { uploadedBy: userId },      // self notes
        { visibility: "global" },    // admin global notes
      ],
    };

    const filter = { ...baseFilter };

    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name role");

    return res.json(notes);
  } catch (err) {
    console.error("Get notes error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/notes
// user: personal note
// admin: global note
exports.createNote = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role; // "user" | "admin"

    const { title, description, fileUrl, tags } = req.body;

    if (!title || !fileUrl) {
      return res
        .status(400)
        .json({ message: "Title and PDF URL are required" });
    }

    const note = await Note.create({
      title: title.trim(),
      description: description?.trim() || "",
      fileUrl: fileUrl.trim(),
      tags: Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : [],
      uploadedBy: userId,
      uploadedByRole: userRole === "admin" ? "admin" : "user",
      visibility: userRole === "admin" ? "global" : "user",
    });

    return res.status(201).json(note);
  } catch (err) {
    console.error("Create note error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/notes/:id
// admin: kisi ka bhi note delete
// user: sirf apne personal notes (visibility: "user")
exports.deleteNote = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const noteId = req.params.id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (userRole === "admin") {
      await note.deleteOne();
      return res.json({ message: "Note deleted" });
    }

    // normal user
    if (
      String(note.uploadedBy) !== String(userId) ||
      note.visibility === "global"
    ) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this note" });
    }

    await note.deleteOne();

    return res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("Delete note error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
