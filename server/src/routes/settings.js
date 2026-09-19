import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("blockedUsers", "username avatar");
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      provider: user.provider,
      chatTheme: user.chatTheme,
      chatBackground: user.chatBackground,
      settings: user.settings,
      blockedUsers: user.blockedUsers,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/privacy", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "settings.privacy": req.body } },
      { new: true }
    );
    res.json({ privacy: user.settings.privacy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/notifications", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "settings.notifications": req.body } },
      { new: true }
    );
    res.json({ notifications: user.settings.notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/chats", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "settings.chats": req.body } },
      { new: true }
    );
    res.json({ chats: user.settings.chats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/accessibility", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "settings.accessibility": req.body } },
      { new: true }
    );
    res.json({ accessibility: user.settings.accessibility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/language", protect, async (req, res) => {
  try {
    const { language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "settings.language": language } },
      { new: true }
    );
    res.json({ language: user.settings.language });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/broadcasts", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "settings.broadcasts": req.body } },
      { new: true }
    );
    res.json({ broadcasts: user.settings.broadcasts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/parental", protect, async (req, res) => {
  try {
    const { enabled, pin } = req.body;
    const update = { "settings.parental.enabled": !!enabled };
    if (enabled && pin) {
      update["settings.parental.pinHash"] = await bcrypt.hash(String(pin), 10);
    } else if (!enabled) {
      update["settings.parental.pinHash"] = "";
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    );
    res.json({ parental: user.settings.parental });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/parental/verify", protect, async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id).select(
      "+settings.parental.pinHash"
    );
    if (!user?.settings?.parental?.pinHash) {
      return res.status(400).json({ message: "Not configured" });
    }
    const ok = await bcrypt.compare(String(pin), user.settings.parental.pinHash);
    res.json({ ok });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/block/:userId", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { blockedUsers: req.params.userId } },
      { new: true }
    ).populate("blockedUsers", "username avatar");
    res.json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/block/:userId", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: req.params.userId } },
      { new: true }
    ).populate("blockedUsers", "username avatar");
    res.json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/starred", protect, async (req, res) => {
  try {
    const messages = await Message.find({ starredBy: req.user._id })
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar")
      .sort({ updatedAt: -1 })
      .limit(200);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/star/:messageId", protect, async (req, res) => {
  try {
    const { starred } = req.body;
    const update = starred
      ? { $addToSet: { starredBy: req.user._id } }
      : { $pull: { starredBy: req.user._id } };
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      update,
      { new: true }
    );
    if (!message) return res.status(404).json({ message: "Not found" });
    res.json({ starred });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/storage", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      sender: req.user._id,
      attachment: { $ne: null },
    }).lean();
    let total = 0;
    const byKind = { image: 0, audio: 0, file: 0 };
    messages.forEach((m) => {
      const size = m.attachment?.size || 0;
      total += size;
      const kind = m.attachment?.kind || "file";
      byKind[kind] = (byKind[kind] || 0) + size;
    });
    res.json({ total, byKind, count: messages.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/feedback", protect, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const mongoose = (await import("mongoose")).default;
    const feedbackSchema = new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        subject: String,
        message: String,
      },
      { timestamps: true }
    );
    const Feedback =
      mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
    await Feedback.create({
      user: req.user._id,
      subject: subject || "",
      message: message || "",
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;