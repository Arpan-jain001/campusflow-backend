// src/controllers/task.controller.js
const Task = require("../models/Task");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/sendPush");


// ---------- Student side (self) ----------

exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({
      assignedTo: userId,
    }).sort({ dueDate: 1, createdAt: -1 });

    return res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, subject, priority, status, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      title,
      description,
      subject,
      priority,
      status,
      dueDate,
      createdBy: userId,
      assignedBy: userId,
      assignedTo: userId,
      visibility: "self",
    });

    return res.status(201).json(task);
  } catch (err) {
    console.error("Create task error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    // sirf woh tasks jahan user ne khud create bhi kiya ho
    const task = await Task.findOne({
      _id: taskId,
      assignedTo: userId,
      createdBy: userId,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, description, subject, priority, status, dueDate } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (subject !== undefined) task.subject = subject;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    return res.json(task);
  } catch (err) {
    console.error("Update task error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    // delete only self‑created tasks
    const task = await Task.findOneAndDelete({
      _id: taskId,
      assignedTo: userId,
      createdBy: userId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ---------- Admin side (global + per user) ----------

// global broadcast tasks list (jo sab ke liye bane)
exports.getGlobalTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ visibility: "global" })
      .populate("assignedTo", "name rollNumber email")
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (err) {
    console.error("Get global tasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// admin: global task create -> sab students ke liye copy banega
exports.createGlobalTask = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { title, description, subject, priority, status, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // saare active students lo
    const students = await User.find(
      { role: "user", status: "active" },
      "_id"
    );
    if (!students.length) {
      return res.status(400).json({ message: "No active students to assign" });
    }

    // saare students ke liye task copy banao
    const docs = students.map((student) => ({
      title,
      description,
      subject,
      priority,
      status,
      dueDate,
      createdBy: adminId,
      assignedBy: adminId,
      assignedTo: student._id,
      visibility: "global",
    }));

    const tasks = await Task.insertMany(docs);

    // 🔔 PUSH NOTIFICATION: sab active students jinke paas pushToken hai
    try {
      const studentsWithToken = await User.find({
        role: "user",
        status: "active",
        pushToken: { $ne: null },
      }).select("pushToken");

      const tokens = studentsWithToken.map((u) => u.pushToken);
      if (tokens.length) {
        await sendPushNotification(
          tokens,
          "New Task Assigned",
          title || "A new task has been assigned to you.",
          { kind: "task" }
        );
      }
    } catch (pushErr) {
      console.error("Global task push error", pushErr);
      // notification fail ho jaye to bhi tasks create rahenge
    }

    return res.status(201).json({
      message: `Task assigned to ${students.length} students`,
      tasksCount: tasks.length,
      tasks: tasks.slice(0, 5),
    });
  } catch (err) {
    console.error("Create global task error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// admin: specific user ke liye task create
exports.createUserTask = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { title, description, subject, priority, status, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // check karo user exist karta hai ya nahi
    const user = await User.findOne({ _id: userId, role: "user" });
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const task = await Task.create({
      title,
      description,
      subject,
      priority,
      status,
      dueDate,
      createdBy: adminId,
      assignedBy: adminId,
      assignedTo: userId,
      visibility: "global",
    });

    return res.status(201).json(task);
  } catch (err) {
    console.error("Create user task error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// admin: specific user ke tasks list
exports.getUserTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    const tasks = await Task.find({ assignedTo: userId })
      .populate("createdBy", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (err) {
    console.error("Get user tasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
