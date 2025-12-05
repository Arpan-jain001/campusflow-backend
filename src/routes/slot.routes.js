const express = require("express");
const Slot = require("../models/Slot");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// ADMIN: create slot (mark empty slot)
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: "date, startTime, endTime required" });
    }
    const slot = await Slot.create({ date, startTime, endTime });
    res.json(slot);
  } catch (err) {
    console.error("Create slot error", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Slot already exists for this time" });
    }
    res.status(500).json({ message: "Could not create slot" });
  }
});

// ADMIN: verify / free a booked slot (mark available, remove bookedBy)
router.patch("/:id/verify", auth, requireAdmin, async (req, res) => {
  try {
    const slot = await Slot.findByIdAndUpdate(
      req.params.id,
      { status: "available", bookedBy: null },
      { new: true }
    );
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    res.json(slot);
  } catch (err) {
    console.error("Verify slot error", err);
    res.status(500).json({ message: "Could not verify slot" });
  }
});

// USER: list slots for a date (admin bhi use kar sakta)
router.get("/", auth, async (req, res) => {
  try {
    const { date } = req.query; // optional
    const filter = {};
    if (date) filter.date = date;
    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (err) {
    console.error("List slots error", err);
    res.status(500).json({ message: "Could not load slots" });
  }
});

// USER: book a slot agar available hai
router.post("/:id/book", auth, async (req, res) => {
  try {
    const slot = await Slot.findOneAndUpdate(
      { _id: req.params.id, status: "available" },
      { status: "booked", bookedBy: req.user._id },
      { new: true }
    );
    if (!slot) {
      return res
        .status(409)
        .json({ message: "Slot not available anymore. Please pick another." });
    }
    res.json(slot);
  } catch (err) {
    console.error("Book slot error", err);
    res.status(500).json({ message: "Could not book slot" });
  }
});

module.exports = router;
