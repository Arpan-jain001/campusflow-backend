const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed");
    return;
  }

  const existing = await User.findOne({ email, role: "admin" });
  if (existing) {
    console.log("Admin user already exists");
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  const admin = await User.create({
    name: "Campus Admin",
    email,
    passwordHash: hash,
    role: "admin",
    status: "active",
    college: "CampusFlow",
  });

  console.log("Admin user created:", admin.email);
}

module.exports = ensureAdmin;
