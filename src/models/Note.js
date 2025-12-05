// src/models/Note.js
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true, // Google Drive, Cloudinary, S3, etc.
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // naya: personal vs global
    visibility: {
      type: String,
      enum: ["user", "global"],
      default: "user",
    },
  },
  { timestamps: true }
);

// optional: title text index for search
noteSchema.index({ title: "text" });

module.exports = mongoose.model("Note", noteSchema);
