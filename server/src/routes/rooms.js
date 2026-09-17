import express from "express";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";
import { onlineUsers } from "../socket/socketHandler.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate("members", "-password")
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Name and at least one member required" });
    }
    const uniqueMembers = Array.from(
      new Set([req.user._id.toString(), ...memberIds.map(String)])
    );
    const room = await Room.create({
      name,
      members: uniqueMembers,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      uniqueMembers.forEach((memberId) => {
        const socketId = onlineUsers.get(memberId.toString());
        if (socketId) {
          const target = io.sockets.sockets.get(socketId);
          if (target) target.join(`room:${room._id.toString()}`);
        }
      });
    }

    const populated = await room.populate("members", "-password");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:roomId/messages", protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not a member" });
    }
    const messages = await Message.find({
      room: room._id,
      deletedFor: { $ne: req.user._id },
    })
      .populate("sender", "username avatar")
      .populate("reactions.user", "username avatar")
      .populate({
        path: "replyTo",
        select: "text sender deletedAt type",
        populate: { path: "sender", select: "username" },
      })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;