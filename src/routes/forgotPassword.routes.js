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

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0b1120; padding: 24px; color: #e5e7eb;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #020617; border-radius: 18px; border: 1px solid #1f2937; padding: 20px 20px 24px;">
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; font-weight: 600;">
              UrbanTales
            </div>
            <div style="font-size: 22px; font-weight: 700; color: #f9fafb; margin-top: 4px;">
              CampusFlow password reset
            </div>
          </div>

          <p style="font-size: 14px; color: #d1d5db; margin: 0 0 8px;">
            Hi${user.name ? " " + user.name : ""},
          </p>

          <p style="font-size: 13px; color: #9ca3af; margin: 0 0 12px;">
            Use the code below to reset your CampusFlow password. This code will expire in
            <span style="color:#bfdbfe;">10 minutes</span>.
          </p>

          <div style="margin: 18px 0; text-align: center;">
            <div style="
              display: inline-block;
              padding: 10px 18px;
              border-radius: 999px;
              border: 1px solid #1d4ed8;
              background: radial-gradient(circle at 0 0, rgba(56,189,248,0.16), transparent 55%),
                          radial-gradient(circle at 100% 100%, rgba(239,68,68,0.18), transparent 55%),
                          #020617;
              font-size: 24px;
              letter-spacing: 6px;
              font-weight: 700;
              color: #f9fafb;
            ">
              ${otp}
            </div>
          </div>

          <p style="font-size: 12px; color: #6b7280; margin: 0 0 6px;">
            If you didn&apos;t request a password reset, you can safely ignore this email.
          </p>

          <p style="font-size: 11px; color: #4b5563; margin-top: 16px; border-top: 1px solid #111827; padding-top: 10px;">
            CampusFlow by UrbanTales • Focused planning for your college life
          </p>
        </div>
      </div>
    `;

    await sendEmail({ to: user.email, subject, text, html });

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
