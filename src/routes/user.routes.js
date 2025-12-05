const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth.middleware"); // or wherever your auth is

const router = express.Router();

// Set device push token
router.post("/device-token", auth, async (req, res) => {
  if (!req.body.token) return res.status(400).json({ error: "No token" });
  await User.findByIdAndUpdate(req.user._id, { pushToken: req.body.token });
  res.json({ ok: true });
});

module.exports = router;
