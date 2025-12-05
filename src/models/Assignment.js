const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    subject: String,
    type: {
      type: String,
      enum: ["theory", "practical", "coding"],
      default: "theory",
    },
    dueDate: { type: Date, required: true },
    course: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // admin ID
    },
    // resources jo user dekh sakta hai
    fileUrl: String,       // main PDF / doc URL
    resourceLink: String,  // extra link (Drive, GitHub etc.)
    // solution ke लिए (user ke solution button ko enable karega)
    solutionUrl: String,
    // optional: agar future me per-student assignment ko tag karna ho
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
