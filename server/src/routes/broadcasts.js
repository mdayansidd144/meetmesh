import express from "express";
import BroadcastList from "../models/BroadcastList.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { onlineUsers } from "../socket/socketHandler.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const lists = await BroadcastList.find({ owner: req.user._id })
      .populate("recipients", "username avatar")
      .sort({ updatedAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { name, recipientIds } = req.body;
    if (!name || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: "Name and recipients required" });
    }
    const list = await BroadcastList.create({
      owner: req.user._id,
      name: name.trim(),
      recipients: recipientIds,
    });
    const populated = await list.populate("recipients", "username avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const { name, recipientIds } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (Array.isArray(recipientIds)) update.recipients = recipientIds;
    const list = await BroadcastList.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      update,
      { new: true }
    ).populate("recipients", "username avatar");
    if (!list) return res.status(404).json({ message: "Not found" });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await BroadcastList.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/send", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text required" });
    }
    const list = await BroadcastList.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!list) return res.status(404).json({ message: "Not found" });

    const io = req.app.get("io");
    const created = [];
    for (const recipientId of list.recipients) {
      const recipient = await User.findById(recipientId);
      if (!recipient) continue;
      if (
        recipient.blockedUsers?.some(
          (b) => b.toString() === req.user._id.toString()
        )
      ) {
        continue;
      }
      const message = await Message.create({
        sender: req.user._id,
        receiver: recipientId,
        text,
        type: "broadcast",
      });
      const populated = await message.populate("sender", "username avatar");
      const hasSockets = onlineUsers.has(recipientId.toString());
      if (hasSockets && io) {
        message.delivered = true;
        await message.save();
        io.to(`user:${recipientId}`).emit(
          "message:receive",
          populated.toObject()
        );
      }
      created.push(populated.toObject());
    }
    res.status(201).json({ sent: created.length, messages: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;