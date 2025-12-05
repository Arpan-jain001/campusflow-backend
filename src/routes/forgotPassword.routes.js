const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/forgot-password/start
router.post("/forgot-password/start", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ ok: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        ok: false,
        reason: "NOT_FOUND",
        message: "No account found with this email",
      });
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpiresAt = expires;
    await user.save();

    const subject = "CampusFlow password reset code";
    const text = `Your CampusFlow password reset code is ${otp}. It will expire in 10 minutes.`;

    await sendEmail(user.email, subject, text);

    return res.json({ ok: true });
  } catch (err) {
    console.error("forgot-password/start error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Something went wrong" });
  }
});

// POST /api/auth/forgot-password/verify
router.post("/forgot-password/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ ok: false, message: "Email and code are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp) {
      return res
        .status(400)
        .json({ ok: false, message: "No reset request found" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({
        ok: false,
        reason: "INVALID",
        message: "Invalid code",
      });
    }

    if (!user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
      return res.status(400).json({
        ok: false,
        reason: "EXPIRED",
        message: "Code expired, please request a new one",
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("forgot-password/verify error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Something went wrong" });
  }
});

// POST /api/auth/forgot-password/reset
router.post("/forgot-password/reset", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email, code and new password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp) {
      return res
        .status(400)
        .json({ ok: false, message: "No reset request found" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({
        ok: false,
        reason: "INVALID",
        message: "Invalid code",
      });
    }

    if (!user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
      return res.status(400).json({
        ok: false,
        reason: "EXPIRED",
        message: "Code expired, please request a new one",
      });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    user.passwordHash = hash;
    user.resetOtp = undefined;
    user.resetOtpExpiresAt = undefined;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("forgot-password/reset error", err);
    return res
      .status(500)
      .json({ ok: false, message: "Something went wrong" });
  }
});

module.exports = router;
