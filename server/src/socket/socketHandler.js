import Message from "../models/Message.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import { sendPushToUser } from "../routes/push.js";

export const onlineUsers = new Map();
export const socketToUser = new Map();

const addSocket = (userId, socketId) => {
  const key = userId.toString();
  const set = onlineUsers.get(key) || new Set();
  set.add(socketId);
  onlineUsers.set(key, set);
  socketToUser.set(socketId, key);
};

const removeSocket = (socketId) => {
  const userId = socketToUser.get(socketId);
  socketToUser.delete(socketId);
  if (!userId) return null;
  const set = onlineUsers.get(userId);
  if (!set) return null;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return userId;
  }
  return null;
};

export const getUserSocket = (userId) => {
  const key = userId?.toString?.() || String(userId);
  const set = onlineUsers.get(key);
  if (!set || set.size === 0) return null;
  return [...set][0];
};

// ✅ Round 2: shared contact check
const areContacts = async (meId, otherId) => {
  const c = await Contact.findOne({
    status: "accepted",
    $or: [
      { sender: meId, receiver: otherId },
      { sender: otherId, receiver: meId },
    ],
  });
  return !!c;
};

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("user:online", async (userId) => {
      if (!userId) return;
      const key = userId.toString();
      addSocket(key, socket.id);
      socket.join(`user:${key}`);
      await User.findByIdAndUpdate(key, { online: true });

      const rooms = await Room.find({ members: key }).select("_id");
      rooms.forEach((r) => socket.join(`room:${r._id.toString()}`));

      const undelivered = await Message.updateMany(
        { receiver: key, delivered: false, scheduledFor: null },
        { delivered: true }
      );

      if (undelivered.modifiedCount > 0) {
        const senders = await Message.distinct("sender", {
          receiver: key,
          delivered: true,
        });
        senders.forEach((senderId) => {
          io.to(`user:${senderId}`).emit("messages:delivered", { by: key });
        });
      }

      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    socket.on("room:join", ({ roomId }) => {
      if (roomId) socket.join(`room:${roomId}`);
    });

    socket.on("room:leave", ({ roomId }) => {
      if (roomId) socket.leave(`room:${roomId}`);
    });

    socket.on(
      "message:send",
      async ({ sender, receiver, text, tempId, replyTo, attachment, scheduledFor }) => {
        try {
          // ✅ Round 2: enforce contact check
          const ok = await areContacts(sender, receiver);
          if (!ok) {
            socket.emit("message:error", {
              tempId,
              message: "You can only message accepted contacts",
              code: "NOT_CONTACTS",
            });
            return;
          }

          const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();

          const message = await Message.create({
            sender,
            receiver,
            text: text || "",
            replyTo: replyTo || null,
            attachment: attachment || null,
            type: attachment ? "attachment" : "text",
            forwardedFrom: null,
            scheduledFor: isScheduled ? new Date(scheduledFor) : null,
            delivered: !isScheduled,
          });

          if (isScheduled) {
            socket.emit("scheduled:queued", {
              tempId,
              messageId: message._id,
              scheduledFor: message.scheduledFor,
            });
            return;
          }

          const populated = await message.populate([
            { path: "sender", select: "username avatar" },
            { path: "reactions.user", select: "username avatar" },
            {
              path: "replyTo",
              select: "text sender deletedAt type attachment",
              populate: { path: "sender", select: "username" },
            },
          ]);

          const receiverKey = receiver.toString();
          const hasReceiver =
            onlineUsers.has(receiverKey) &&
            onlineUsers.get(receiverKey).size > 0;

          if (hasReceiver) {
            io.to(`user:${receiverKey}`).emit(
              "message:receive",
              populated.toObject()
            );
            io.to(`user:${sender.toString()}`).emit("messages:delivered", {
              by: receiverKey,
            });
          } else {
            (async () => {
              try {
                const senderUser = await User.findById(sender).select(
                  "username"
                );
                const preview =
                  text && text.trim()
                    ? text.slice(0, 120)
                    : attachment
                    ? "Sent an attachment"
                    : "New message";
                await sendPushToUser(receiverKey, {
                  title: senderUser?.username || "New message",
                  body: preview,
                  icon: "/favicon.svg",
                  tag: `msg-${message._id}`,
                  data: { type: "message", senderId: sender },
                });
              } catch {}
            })();
          }

          socket.emit("message:sent", { ...populated.toObject(), tempId });
        } catch (err) {
          console.error("message:send error:", err.message);
        }
      }
    );

    socket.on(
      "room:message:send",
      async ({ sender, roomId, text, tempId, replyTo, attachment }) => {
        try {
          const room = await Room.findById(roomId);
          if (!room) return;
          if (!room.members.some((m) => m.toString() === sender.toString())) return;

          const message = await Message.create({
            sender,
            room: roomId,
            text: text || "",
            replyTo: replyTo || null,
            attachment: attachment || null,
            type: attachment ? "attachment" : "text",
          });
          const populated = await message.populate([
            { path: "sender", select: "username avatar" },
            { path: "reactions.user", select: "username avatar" },
            {
              path: "replyTo",
              select: "text sender deletedAt type attachment",
              populate: { path: "sender", select: "username" },
            },
          ]);

          io.to(`room:${roomId}`).emit(
            "room:message:receive",
            populated.toObject()
          );
          socket.emit("room:message:sent", {
            ...populated.toObject(),
            tempId,
          });

          (async () => {
            try {
              const senderUser = await User.findById(sender).select("username");
              const preview =
                text && text.trim()
                  ? text.slice(0, 120)
                  : attachment
                  ? "Sent an attachment"
                  : "New message";
              for (const memberId of room.members) {
                const memberStr = memberId.toString();
                if (memberStr === sender.toString()) continue;
                if (onlineUsers.has(memberStr)) continue;
                await sendPushToUser(memberStr, {
                  title: `${senderUser?.username || "Someone"} in ${room.name}`,
                  body: preview,
                  icon: "/favicon.svg",
                  tag: `room-${roomId}`,
                  data: { type: "message", roomId },
                });
              }
            } catch {}
          })();
        } catch (err) {
          console.error("room:message:send error:", err.message);
        }
      }
    );

    socket.on(
      "call:log",
      async ({ sender, receiver, roomId, type, status, duration }) => {
        try {
          const payload = {
            sender,
            text: "",
            type,
            callMeta: { status, duration: duration || 0 },
          };
          if (roomId) payload.room = roomId;
          else payload.receiver = receiver;

          const message = await Message.create(payload);
          const populated = await message.populate("sender", "username avatar");

          if (roomId) {
            io.to(`room:${roomId}`).emit("call:log:new", populated.toObject());
          } else {
            io.to(`user:${sender.toString()}`).emit("call:log:new", populated.toObject());
            io.to(`user:${receiver.toString()}`).emit("call:log:new", populated.toObject());
          }
        } catch (err) {
          console.error("call:log error:", err.message);
        }
      }
    );

    socket.on("room:typing:start", ({ sender, roomId, username }) => {
      socket.to(`room:${roomId}`).emit("room:typing:start", { from: sender, username });
    });

    socket.on("room:typing:stop", ({ sender, roomId }) => {
      socket.to(`room:${roomId}`).emit("room:typing:stop", { from: sender });
    });

    socket.on("messages:read", async ({ reader, sender }) => {
      try {
        await Message.updateMany(
          { sender, receiver: reader, read: false },
          { read: true, delivered: true }
        );
        io.to(`user:${sender.toString()}`).emit("messages:read", { by: reader });
      } catch (err) {
        console.error("messages:read error:", err.message);
      }
    });

    socket.on("room:messages:read", async ({ reader, roomId }) => {
      try {
        await Message.updateMany(
          { room: roomId, readBy: { $ne: reader }, sender: { $ne: reader } },
          { $addToSet: { readBy: reader } }
        );
        io.to(`room:${roomId}`).emit("room:read:update", { reader, roomId });
      } catch (err) {
        console.error("room:messages:read error:", err.message);
      }
    });

    socket.on("typing:start", ({ sender, receiver }) => {
      io.to(`user:${receiver.toString()}`).emit("typing:start", { from: sender });
    });

    socket.on("typing:stop", ({ sender, receiver }) => {
      io.to(`user:${receiver.toString()}`).emit("typing:stop", { from: sender });
    });

    socket.on("call:initiate", async ({ from, to, offer, callerName, video }) => {
      const toKey = to.toString();
      const hasReceiver =
        onlineUsers.has(toKey) && onlineUsers.get(toKey).size > 0;
      if (hasReceiver) {
        io.to(`user:${toKey}`).emit("call:incoming", { from, offer, callerName, video });
      } else {
        socket.emit("call:unavailable", { to });
        sendPushToUser(toKey, {
          title: `${callerName || "Someone"} is calling`,
          body: video ? "Incoming video call" : "Incoming voice call",
          icon: "/favicon.svg",
          tag: `call-${from}`,
          data: { type: "call", from },
        });
      }
    });

    socket.on("call:answer", ({ to, answer }) => {
      io.to(`user:${to.toString()}`).emit("call:answered", { answer });
    });

    socket.on("call:ice-candidate", ({ to, candidate }) => {
      io.to(`user:${to.toString()}`).emit("call:ice-candidate", { candidate });
    });

    socket.on("call:decline", ({ to }) => {
      io.to(`user:${to.toString()}`).emit("call:declined");
    });

    socket.on("call:end", ({ to }) => {
      io.to(`user:${to.toString()}`).emit("call:ended");
    });

    socket.on("disconnect", async () => {
      const wentOffline = removeSocket(socket.id);
      if (wentOffline) {
        await User.findByIdAndUpdate(wentOffline, { online: false });
      }
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });
};