const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendMail } = require("../config/mailer");

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password, dob, degree, branch, year, college } =
      req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const lastUser = await User.findOne().sort({ rollNumber: -1 });
    const nextRoll = (lastUser?.rollNumber || 0) + 1;

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await User.create({
      name,
      email,
      passwordHash,
      dob,
      degree,
      branch,
      year,
      college,
      role: "user",
      status: "pending",
      rollNumber: nextRoll,
      otp,
      otpExpiresAt,
    });

    const html = `
      <div style="font-family:system-ui,Segoe UI,sans-serif;padding:16px;background:#0b1120;color:#e5e7eb">
        <h2 style="color:#60a5fa">Verify your CampusFlow account</h2>
        <p>Hi ${name},</p>
        <p>Use the OTP below to verify your email for <b>CampusFlow by UrbanTales</b>:</p>
        <div style="margin:16px 0;padding:12px 16px;border-radius:999px;background:#020617;border:1px solid #1d4ed8;display:inline-block;font-size:24px;letter-spacing:6px;font-weight:700;">
          ${otp}
        </div>
        <p style="color:#9ca3af">This code is valid for 15 minutes. If you didn’t request this, you can ignore this email.</p>
      </div>
    `;

    await sendMail({
      to: email,
      subject: "CampusFlow | Verify your email",
      html,
    });

    return res.status(201).json({
      message: "Signup successful, please verify OTP sent to email",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.otp || user.status === "active") {
      return res
        .status(400)
        .json({ message: "Invalid verification request" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.status = "active";
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    // admin ko verify skip, student ke लिए required
    if (user.role !== "admin" && user.status !== "active") {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    if (role && user.role !== role) {
      return res
        .status(403)
        .json({ message: "Role not allowed for this user" });
    }

    if (!user.passwordHash) {
      console.error("Login error: user without passwordHash", user._id);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        rollNumber: user.rollNumber,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        degree: user.degree,
        branch: user.branch,
        year: user.year,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
