// import Message from "../models/Message.js";
// import Room from "../models/Room.js";
// import User from "../models/User.js";
// import { sendPushToUser } from "../routes/push.js";

// export const onlineUsers = new Map();

// export const socketHandler = (io) => {
//   io.on("connection", (socket) => {
//     socket.on("user:online", async (userId) => {
//       onlineUsers.set(userId, socket.id);
//       socket.join(`user:${userId}`);
//       await User.findByIdAndUpdate(userId, { online: true });

//       const rooms = await Room.find({ members: userId }).select("_id");
//       rooms.forEach((r) => socket.join(`room:${r._id.toString()}`));

//       const undelivered = await Message.updateMany(
//         { receiver: userId, delivered: false },
//         { delivered: true }
//       );

//       if (undelivered.modifiedCount > 0) {
//         const senders = await Message.distinct("sender", {
//           receiver: userId,
//           delivered: true,
//         });
//         senders.forEach((senderId) => {
//           const senderSocket = onlineUsers.get(senderId.toString());
//           if (senderSocket) {
//             io.to(senderSocket).emit("messages:delivered", { by: userId });
//           }
//         });
//       }

//       io.emit("users:online", Array.from(onlineUsers.keys()));
//     });

//     socket.on("room:join", ({ roomId }) => {
//       if (roomId) socket.join(`room:${roomId}`);
//     });

//     socket.on("room:leave", ({ roomId }) => {
//       if (roomId) socket.leave(`room:${roomId}`);
//     });

//     // ⚡ Emit first, background the delivered flag + push
//     socket.on(
//       "message:send",
//       async ({ sender, receiver, text, tempId, replyTo, attachment }) => {
//         try {
//           const message = await Message.create({
//             sender,
//             receiver,
//             text: text || "",
//             replyTo: replyTo || null,
//             attachment: attachment || null,
//             type: attachment ? "attachment" : "text",
//           });

//           const populated = await message.populate([
//             { path: "sender", select: "username avatar" },
//             { path: "reactions.user", select: "username avatar" },
//             {
//               path: "replyTo",
//               select: "text sender deletedAt type attachment",
//               populate: { path: "sender", select: "username" },
//             },
//           ]);

//           const receiverSocketId = onlineUsers.get(receiver);
//           if (receiverSocketId) {
//             io.to(receiverSocketId).emit(
//               "message:receive",
//               populated.toObject()
//             );
//             Message.updateOne(
//               { _id: message._id },
//               { $set: { delivered: true } }
//             ).catch(() => {});
//             io.to(`user:${sender}`).emit("messages:delivered", {
//               by: receiver,
//             });
//           } else {
//             (async () => {
//               try {
//                 const senderUser = await User.findById(sender).select(
//                   "username"
//                 );
//                 const preview =
//                   text && text.trim()
//                     ? text.slice(0, 120)
//                     : attachment
//                     ? "Sent an attachment"
//                     : "New message";
//                 await sendPushToUser(receiver, {
//                   title: senderUser?.username || "New message",
//                   body: preview,
//                   icon: "/favicon.svg",
//                   tag: `msg-${message._id}`,
//                   data: { type: "message", senderId: sender },
//                 });
//               } catch {}
//             })();
//           }

//           socket.emit("message:sent", { ...populated.toObject(), tempId });
//         } catch (err) {
//           console.error(err.message);
//         }
//       }
//     );

//     // ⚡ Same pattern for room messages
//     socket.on(
//       "room:message:send",
//       async ({ sender, roomId, text, tempId, replyTo, attachment }) => {
//         try {
//           const room = await Room.findById(roomId);
//           if (!room) return;
//           if (!room.members.some((m) => m.toString() === sender.toString())) {
//             return;
//           }
//           const message = await Message.create({
//             sender,
//             room: roomId,
//             text: text || "",
//             replyTo: replyTo || null,
//             attachment: attachment || null,
//             type: attachment ? "attachment" : "text",
//           });
//           const populated = await message.populate([
//             { path: "sender", select: "username avatar" },
//             { path: "reactions.user", select: "username avatar" },
//             {
//               path: "replyTo",
//               select: "text sender deletedAt type attachment",
//               populate: { path: "sender", select: "username" },
//             },
//           ]);

//           io.to(`room:${roomId}`).emit(
//             "room:message:receive",
//             populated.toObject()
//           );
//           socket.emit("room:message:sent", {
//             ...populated.toObject(),
//             tempId,
//           });

//           (async () => {
//             try {
//               const senderUser = await User.findById(sender).select(
//                 "username"
//               );
//               const preview =
//                 text && text.trim()
//                   ? text.slice(0, 120)
//                   : attachment
//                   ? "Sent an attachment"
//                   : "New message";
//               for (const memberId of room.members) {
//                 const memberStr = memberId.toString();
//                 if (memberStr === sender.toString()) continue;
//                 if (onlineUsers.has(memberStr)) continue;
//                 await sendPushToUser(memberStr, {
//                   title: `${senderUser?.username || "Someone"} in ${room.name}`,
//                   body: preview,
//                   icon: "/favicon.svg",
//                   tag: `room-${roomId}`,
//                   data: { type: "message", roomId },
//                 });
//               }
//             } catch {}
//           })();
//         } catch (err) {
//           console.error(err.message);
//         }
//       }
//     );

//     socket.on(
//       "call:log",
//       async ({ sender, receiver, roomId, type, status, duration }) => {
//         try {
//           const payload = {
//             sender,
//             text: "",
//             type,
//             callMeta: { status, duration: duration || 0 },
//           };
//           if (roomId) payload.room = roomId;
//           else payload.receiver = receiver;

//           const message = await Message.create(payload);
//           const populated = await message.populate(
//             "sender",
//             "username avatar"
//           );

//           if (roomId) {
//             io.to(`room:${roomId}`).emit("call:log:new", populated.toObject());
//           } else {
//             const senderSocket = onlineUsers.get(sender.toString());
//             const receiverSocket = onlineUsers.get(receiver.toString());
//             if (senderSocket) {
//               io.to(senderSocket).emit("call:log:new", populated.toObject());
//             }
//             if (receiverSocket) {
//               io.to(receiverSocket).emit("call:log:new", populated.toObject());
//             }
//           }
//         } catch (err) {
//           console.error(err.message);
//         }
//       }
//     );

//     socket.on("room:typing:start", ({ sender, roomId, username }) => {
//       socket.to(`room:${roomId}`).emit("room:typing:start", {
//         from: sender,
//         username,
//       });
//     });

//     socket.on("room:typing:stop", ({ sender, roomId }) => {
//       socket.to(`room:${roomId}`).emit("room:typing:stop", { from: sender });
//     });

//     socket.on("messages:read", async ({ reader, sender }) => {
//       try {
//         await Message.updateMany(
//           { sender, receiver: reader, read: false },
//           { read: true, delivered: true }
//         );
//         const senderSocketId = onlineUsers.get(sender);
//         if (senderSocketId) {
//           io.to(senderSocketId).emit("messages:read", { by: reader });
//         }
//       } catch (err) {
//         console.error(err.message);
//       }
//     });

//     socket.on("typing:start", ({ sender, receiver }) => {
//       const receiverSocketId = onlineUsers.get(receiver);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("typing:start", { from: sender });
//       }
//     });

//     socket.on("typing:stop", ({ sender, receiver }) => {
//       const receiverSocketId = onlineUsers.get(receiver);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("typing:stop", { from: sender });
//       }
//     });

//     socket.on("call:initiate", async ({ from, to, offer, callerName, video }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("call:incoming", {
//           from,
//           offer,
//           callerName,
//           video,
//         });
//       } else {
//         socket.emit("call:unavailable", { to });
//         sendPushToUser(to, {
//           title: `${callerName || "Someone"} is calling`,
//           body: video ? "Incoming video call" : "Incoming voice call",
//           icon: "/favicon.svg",
//           tag: `call-${from}`,
//           data: { type: "call", from },
//         });
//       }
//     });

//     socket.on("call:answer", ({ to, answer }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("call:answered", { answer });
//       }
//     });

//     socket.on("call:ice-candidate", ({ to, candidate }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("call:ice-candidate", { candidate });
//       }
//     });

//     socket.on("call:decline", ({ to }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("call:declined");
//       }
//     });

//     socket.on("call:end", ({ to }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("call:ended");
//       }
//     });

//     socket.on("disconnect", async () => {
//       for (const [userId, socketId] of onlineUsers.entries()) {
//         if (socketId === socket.id) {
//           onlineUsers.delete(userId);
//           await User.findByIdAndUpdate(userId, { online: false });
//           break;
//         }
//       }
//       io.emit("users:online", Array.from(onlineUsers.keys()));
//     });
//   });
// };
import Message from "../models/Message.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { sendPushToUser } from "../routes/push.js";

export const onlineUsers = new Map();

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("user:online", async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(`user:${userId}`);
      await User.findByIdAndUpdate(userId, { online: true });

      const rooms = await Room.find({ members: userId }).select("_id");
      rooms.forEach((r) => socket.join(`room:${r._id.toString()}`));

      const undelivered = await Message.updateMany(
        { receiver: userId, delivered: false },
        { delivered: true }
      );

      if (undelivered.modifiedCount > 0) {
        const senders = await Message.distinct("sender", {
          receiver: userId,
          delivered: true,
        });
        senders.forEach((senderId) => {
          const senderSocket = onlineUsers.get(senderId.toString());
          if (senderSocket) {
            io.to(senderSocket).emit("messages:delivered", { by: userId });
          }
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

    // ⚡ Emit first, background the delivered flag + push
    socket.on(
      "message:send",
      async ({ sender, receiver, text, tempId, replyTo, attachment }) => {
        try {
          const message = await Message.create({
            sender,
            receiver,
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

          const receiverSocketId = onlineUsers.get(receiver);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit(
              "message:receive",
              populated.toObject()
            );
            Message.updateOne(
              { _id: message._id },
              { $set: { delivered: true } }
            ).catch(() => {});
            io.to(`user:${sender}`).emit("messages:delivered", {
              by: receiver,
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
                await sendPushToUser(receiver, {
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
          console.error(err.message);
        }
      }
    );

    socket.on(
      "room:message:send",
      async ({ sender, roomId, text, tempId, replyTo, attachment }) => {
        try {
          const room = await Room.findById(roomId);
          if (!room) return;
          if (!room.members.some((m) => m.toString() === sender.toString())) {
            return;
          }
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
              const senderUser = await User.findById(sender).select(
                "username"
              );
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
          console.error(err.message);
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
          const populated = await message.populate(
            "sender",
            "username avatar"
          );

          if (roomId) {
            io.to(`room:${roomId}`).emit("call:log:new", populated.toObject());
          } else {
            const senderSocket = onlineUsers.get(sender.toString());
            const receiverSocket = onlineUsers.get(receiver.toString());
            if (senderSocket) {
              io.to(senderSocket).emit("call:log:new", populated.toObject());
            }
            if (receiverSocket) {
              io.to(receiverSocket).emit("call:log:new", populated.toObject());
            }
          }
        } catch (err) {
          console.error(err.message);
        }
      }
    );

    socket.on("room:typing:start", ({ sender, roomId, username }) => {
      socket.to(`room:${roomId}`).emit("room:typing:start", {
        from: sender,
        username,
      });
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
        const senderSocketId = onlineUsers.get(sender);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages:read", { by: reader });
        }
      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("typing:start", ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:start", { from: sender });
      }
    });

    socket.on("typing:stop", ({ sender, receiver }) => {
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:stop", { from: sender });
      }
    });

    socket.on("call:initiate", async ({ from, to, offer, callerName, video }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call:incoming", {
          from,
          offer,
          callerName,
          video,
        });
      } else {
        socket.emit("call:unavailable", { to });
        sendPushToUser(to, {
          title: `${callerName || "Someone"} is calling`,
          body: video ? "Incoming video call" : "Incoming voice call",
          icon: "/favicon.svg",
          tag: `call-${from}`,
          data: { type: "call", from },
        });
      }
    });

    socket.on("call:answer", ({ to, answer }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call:answered", { answer });
      }
    });

    socket.on("call:ice-candidate", ({ to, candidate }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call:ice-candidate", { candidate });
      }
    });

    socket.on("call:decline", ({ to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call:declined");
      }
    });

    socket.on("call:end", ({ to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call:ended");
      }
    });

    socket.on("disconnect", async () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, { online: false });
          break;
        }
      }
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });
};