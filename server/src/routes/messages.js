import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/conversations/list", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const all = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      room: { $in: [null, undefined] },
      deletedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: -1 })
      .lean();

    const seen = new Map();
    for (const m of all) {
      if (!m.sender || !m.receiver) continue;
      const senderId = m.sender.toString();
      const receiverId = m.receiver.toString();
      const otherId = senderId === userId ? receiverId : senderId;
      const preview =
        m.type === "call_voice"
          ? "Voice call"
          : m.type === "call_video"
          ? "Video call"
          : m.type === "attachment"
          ? "Attachment"
          : m.text || "";
      const isUnread = receiverId === userId && !m.read && !m.deletedAt;

      if (!seen.has(otherId)) {
        seen.set(otherId, {
          contactId: otherId,
          lastMessage: preview,
          lastAt: m.createdAt,
          unread: isUnread ? 1 : 0,
        });
      } else if (isUnread) {
        const entry = seen.get(otherId);
        entry.unread += 1;
      }
    }

    res.json(Array.from(seen.values()));
  } catch (error) {
    console.error("conversations/list error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/calls/list", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await Message.find({
      $or: [
        { sender: userId, type: { $in: ["call_voice", "call_video"] } },
        { receiver: userId, type: { $in: ["call_voice", "call_video"] } },
      ],
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const results = [];
    for (const m of messages) {
      const isMine = m.sender.toString() === userId.toString();
      const otherId = isMine ? m.receiver : m.sender;
      if (!otherId) continue;
      const other = await User.findById(otherId)
        .select("username avatar")
        .lean();
      if (!other) continue;
      results.push({
        _id: m._id,
        type: m.type,
        callMeta: m.callMeta || { status: "missed", duration: 0 },
        createdAt: m.createdAt,
        direction: isMine ? "outgoing" : "incoming",
        other: {
          _id: other._id,
          username: other.username,
          avatar: other.avatar,
        },
      });
    }
    res.json(results);
  } catch (error) {
    console.error("calls/list error:", error);
    res.status(500).json({ message: error.message });
  }
});
router.get("/search", protect, async (req, res) => {
  try {
    const raw = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "40", 10), 100);
    const me = req.user._id;

    if (raw.length < 2) return res.json({ results: [] });

    const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const Room = (await import("../models/Room.js")).default;
    const myRooms = await Room.find({ members: me }).select("_id name").lean();
    const myRoomIds = myRooms.map((r) => r._id);

    const blockedByMe = req.user.blockedUsers?.map((b) => b.toString()) || [];
    const blockedMe = await User.find({ blockedUsers: me }).select("_id").lean();
    const excludeIds = [
      ...new Set([...blockedByMe, ...blockedMe.map((u) => u._id.toString())]),
    ];

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: me, room: null },
            { receiver: me, room: null },
            { room: { $in: myRoomIds } },
          ],
        },
        { text: { $regex: safe, $options: "i" } },
        { type: { $in: ["text", "attachment", "broadcast"] } },
        { deletedFor: { $ne: me } },
        ...(excludeIds.length
          ? [
              { sender: { $nin: excludeIds } },
              { receiver: { $nin: excludeIds } },
            ]
          : []),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "username avatar")
      .populate("room", "name")
      .lean();

    const results = messages.map((m) => {
      const isRoom = !!m.room;
      let peer = null;
      if (isRoom) {
        peer = { _id: m.room._id, username: m.room.name };
      } else {
        const senderId = m.sender?._id?.toString();
        const receiverId = m.receiver?.toString();
        const otherId = senderId === me.toString() ? receiverId : senderId;
        peer = { _id: otherId };
      }
      return {
        _id: m._id,
        text: m.text,
        type: m.type,
        createdAt: m.createdAt,
        isRoom,
        sender: {
          _id: m.sender?._id,
          username: m.sender?.username,
          avatar: m.sender?.avatar,
        },
        room: m.room ? { _id: m.room._id, name: m.room.name } : null,
        peer,
      };
    });

    res.json({ results });
  } catch (error) {
    console.error("messages/search error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:userId", protect, async (req, res) => {
  try {
    const other = req.params.userId.trim();
    if (!other.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: other },
        { sender: other, receiver: req.user._id },
      ],
      deletedFor: { $ne: req.user._id },
    })
      .populate("sender", "username avatar")
      .populate("reactions.user", "username avatar")
      .populate({
        path: "replyTo",
        select: "text sender deletedAt type attachment",
        populate: { path: "sender", select: "username" },
      })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error("messages/:userId error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { receiver, text } = req.body;
    if (!receiver || !text) {
      return res.status(400).json({ message: "Receiver and text required" });
    }
    if (receiver === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }
    const message = await Message.create({
      sender: req.user._id,
      receiver,
      text,
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;