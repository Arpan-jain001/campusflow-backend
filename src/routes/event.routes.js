const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/event.controller");
const Event = require("../models/Event");

const router = express.Router();

router.use(auth);

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// GET /api/events?q=title  (user: self+global, admin: sab – controller handle)
router.get("/", getEvents);

// POST /api/events
router.post("/", createEvent);

// PATCH /api/events/:id
router.patch("/:id", updateEvent);

// DELETE /api/events/:id
router.delete("/:id", deleteEvent);

// ADMIN: GET /api/events/admin/all?q=title  (pure list ke लिए)
router.get("/admin/all", requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = {};
    if (q) filter.title = { $regex: q, $options: "i" };

    const events = await Event.find(filter)
      .sort({ dateTime: 1 })
      .populate("uploadedBy", "name email role");

    return res.json(events);
  } catch (err) {
    console.error("Admin get all events error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
