// src/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not set in .env");
  }

  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
};

module.exports = connectDB;
