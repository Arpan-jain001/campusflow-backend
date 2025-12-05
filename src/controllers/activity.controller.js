const Activity = require("../models/Activity");

// GET /api/activity
exports.getMyActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actor", "name role");

    return res.json(items);
  } catch (err) {
    console.error("Get activity error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/activity/system  (admin -> single student)
exports.createSystemActivity = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { title, message, targetUserId } = req.body;

    if (!title || !targetUserId) {
      return res
        .status(400)
        .json({ message: "Title and target user are required" });
    }

    const item = await Activity.create({
      user: targetUserId,
      actor: actorId,
      type: "system",
      verb: "announcement",
      title: title.trim(),
      message: message?.trim() || "",
      entityId: null,
      typeRef: null,
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error("Create system activity error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
