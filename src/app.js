// src/app.js
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CampusFlow backend running");
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/auth", require("./routes/forgotPassword.routes"));
app.use("/api/tasks", require("./routes/task.routes"));
app.use("/api/notes", require("./routes/note.routes"));
app.use("/api/events", require("./routes/event.routes"));
app.use("/api/activity", require("./routes/activity.routes"));
app.use("/api/quizzes", require("./routes/quizAdmin.routes"));
app.use("/api/quizzes", require("./routes/quiz.routes"));
app.use("/api/quizzes", require("./routes/quizAttempt.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));

app.use("/api/admin", require("./routes/adminUser.routes"));
app.use("/api/admin", require("./routes/admin-activity.routes"));
app.use("/api/assignments", require("./routes/assignment.routes"));
app.use("/api/assignment-submissions", require("./routes/assignmentSubmission.routes"));
app.use("/api/slots", require("./routes/slot.routes"));
app.use("/api/users", require("./routes/user.routes"));


module.exports = app;
