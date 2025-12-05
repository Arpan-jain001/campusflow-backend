const Event = require("../models/Event");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/sendPush");

// GET /api/events?q=ds
exports.getEvents = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    if (userRole === "admin") {
      const filter = {};
      if (q) filter.title = { $regex: q, $options: "i" };

      const events = await Event.find(filter)
        .sort({ dateTime: 1 })
        .populate("uploadedBy", "name role");

      return res.json(events);
    }

    const baseFilter = {
      $or: [{ uploadedBy: userId }, { visibility: "global" }],
    };

    const filter = { ...baseFilter };
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    const events = await Event.find(filter)
      .sort({ dateTime: 1 })
      .populate("uploadedBy", "name role");

    return res.json(events);
  } catch (err) {
    console.error("Get events error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    const { title, description, type, dateTime, location } = req.body;

    if (!title || !dateTime) {
      return res
        .status(400)
        .json({ message: "Title and date/time are required" });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description?.trim() || "",
      type: type || "other",
      dateTime: new Date(dateTime),
      location: location?.trim() || "",
      uploadedBy: userId,
      uploadedByRole: userRole === "admin" ? "admin" : "user",
      visibility: userRole === "admin" ? "global" : "user",
    });

    // 🔔 PUSH NOTIFICATION: sirf admin global events pe
    try {
      if (userRole === "admin") {
        const users = await User.find({
          role: "user",
          status: "active",
          pushToken: { $ne: null },
        }).select("pushToken");

        const tokens = users.map((u) => u.pushToken);
        if (tokens.length) {
          await sendPushNotification(
            tokens,
            "New Event",
            event.title || "A new event has been created.",
            { kind: "event", eventId: event._id.toString() }
          );
        }
      }
    } catch (pushErr) {
      console.error("Event push error", pushErr);
    }

    return res.status(201).json(event);
  } catch (err) {
    console.error("Create event error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (userRole !== "admin" && String(event.uploadedBy) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this event" });
    }

    const { title, description, type, dateTime, location } = req.body;

    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (type !== undefined) event.type = type;
    if (dateTime !== undefined) event.dateTime = new Date(dateTime);
    if (location !== undefined) event.location = location.trim();

    await event.save();

    return res.json(event);
  } catch (err) {
    console.error("Update event error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (userRole !== "admin" && String(event.uploadedBy) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this event" });
    }

    await event.deleteOne();
    return res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("Delete event error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
