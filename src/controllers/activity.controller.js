const Activity = require("../models/Activity");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/sendPush");

// Student ka feed
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

// Admin -> single student system activity + push
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

    // 🔔 push to that single student
    try {
      const user = await User.findOne({
        _id: targetUserId,
        pushToken: { $ne: null },
      }).select("pushToken");

      if (user?.pushToken) {
        await sendPushNotification(
          [user.pushToken],
          title.trim(),
          message?.trim() || "You have a new announcement.",
          {
            kind: "activity",
            activityId: item._id.toString(),
          }
        );
      }
    } catch (pushErr) {
      console.error("Activity system push error:", pushErr);
    }

    return res.status(201).json(item);
  } catch (err) {
    console.error("Create system activity error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
