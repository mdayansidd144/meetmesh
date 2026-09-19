import express from "express";
import Message from "../models/Message.js";
import Room from "../models/Room.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/:messageId", protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ message: "Emoji required" });
    }
    const message = await Message.findById(req.params.messageId).populate(
      "reactions.user",
      "username avatar"
    );
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    const userId = req.user._id.toString();
    const existingIndex = message.reactions.findIndex(
      (r) => r.user._id.toString() === userId
    );
    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();
    await message.populate("reactions.user", "username avatar");

    const io = req.app.get("io");
    if (io) {
      const payload = {
        messageId: message._id,
        reactions: message.reactions,
      };
      if (message.room) {
        io.to(`room:${message.room.toString()}`).emit(
          "message:reaction:update",
          payload
        );
      } else if (message.receiver) {
        io.to(`user:${message.sender.toString()}`).emit(
          "message:reaction:update",
          payload
        );
        io.to(`user:${message.receiver.toString()}`).emit(
          "message:reaction:update",
          payload
        );
      }
    }

    res.json({ messageId: message._id, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const userId = req.user._id.toString();

    if (message.room) {
      const room = await Room.findById(message.room);
      if (!room) return res.status(404).json({ message: "Room not found" });
      if (!room.members.some((m) => m.toString() === userId)) {
        return res.status(403).json({ message: "Not a member" });
      }
      if (!message.deletedFor.some((id) => id.toString() === userId)) {
        message.deletedFor.push(req.user._id);
      }
      const allDeleted = room.members.every((memberId) =>
        message.deletedFor.some((d) => d.toString() === memberId.toString())
      );
      if (allDeleted) {
        await Message.findByIdAndDelete(message._id);
      } else {
        await message.save();
      }
      const io = req.app.get("io");
      if (io) {
        io.to(`room:${message.room.toString()}`).emit("message:deleted", {
          messageId: message._id,
        });
      }
    } else {
      if (
        message.sender.toString() !== userId &&
        message.receiver?.toString() !== userId
      ) {
        return res.status(403).json({ message: "Cannot delete this message" });
      }
      if (!message.deletedFor.some((id) => id.toString() === userId)) {
        message.deletedFor.push(req.user._id);
      }
      const senderId = message.sender.toString();
      const receiverId = message.receiver ? message.receiver.toString() : "";
      const bothDeleted =
        message.deletedFor.some((d) => d.toString() === senderId) &&
        message.deletedFor.some((d) => d.toString() === receiverId);
      if (bothDeleted) {
        await Message.findByIdAndDelete(message._id);
      } else {
        await message.save();
      }
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${senderId}`).emit("message:deleted", {
          messageId: message._id,
        });
        if (receiverId) {
          io.to(`user:${receiverId}`).emit("message:deleted", {
            messageId: message._id,
          });
        }
      }
    }

    res.json({ messageId: message._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;