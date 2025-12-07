const express = require("express");
const auth = require("../middleware/auth.middleware");
const User = require("../models/User");

const router = express.Router();

// Logged-in user ka Expo push token save karo
router.post("/me/push-token", auth, async (req, res) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ message: "pushToken required" });
    }

    await User.findByIdAndUpdate(req.user._id, { pushToken });
    console.log("Saved push token for user:", req.user._id, pushToken);

    res.json({ ok: true });
  } catch (err) {
    console.error("save push token error", err);
    res.status(500).json({ message: "Could not save token" });
  }
});

module.exports = router;
