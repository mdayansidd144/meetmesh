import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
let globalSocket = null;
let globalSocketUserId = null;
const getSocket = (userId) => {
    if (globalSocket && globalSocketUserId === userId && globalSocket.connected) {
    return globalSocket;
  }
  if (globalSocket) {
    try {
      globalSocket.removeAllListeners();
      globalSocket.disconnect();
    } catch {}
    globalSocket = null;
  }
  console.log("[socket] creating new connection for", userId);
  const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 10000,
    forceNew: true,
    query: { userId },
  });
  socket.on("connect", () => {
    console.log(" [socket] connected", socket.id, "as user", userId);
  });
  socket.on("disconnect", (reason) => {
    console.log(" [socket] disconnected:", reason);
  });
  socket.on("connect_error", (err) => {
    console.error(" [socket] connect_error:", err.message);
  });

  globalSocket = socket;
  globalSocketUserId = userId;
  return socket;
};
export const useSocket = (userId, handlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket(userId);
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }
    const bindings = {
      "message:receive": "onMessageReceive",
      "message:sent": "onMessageSent",
      "users:online": "onUsersOnline",
      "typing:start": "onTypingStart",
      "typing:stop": "onTypingStop",
      "messages:read": "onMessagesRead",
      "messages:delivered": "onMessagesDelivered",
      "call:incoming": "onIncomingCall",
      "room:message:receive": "onRoomMessageReceive",
      "room:message:sent": "onRoomMessageSent",
      "room:typing:start": "onRoomTypingStart",
      "room:typing:stop": "onRoomTypingStop",
      "message:reaction:update": "onReactionUpdate",
      "message:deleted": "onMessageDeleted",
      "call:log:new": "onCallLogNew",
      "room:read:update": "onRoomReadUpdate",
      "scheduled:queued": "onScheduledQueued",
      "scheduled:flushed": "onScheduledFlushed",
      "request:received": "onRequestReceived",
      "request:accepted": "onRequestAccepted",
      "request:declined": "onRequestDeclined",
    };
    const boundFns = {};
    for (const [event, key] of Object.entries(bindings)) {
      const fn = (...args) => {
        const h = handlersRef.current?.[key];
        if (typeof h === "function") {
          try {
            h(...args);
          } catch (e) {
            console.error("[socket] handler error:", event, e);
          }
        }
      };
      boundFns[event] = fn;
      socket.on(event, fn);
    }
    return () => {
      for (const [event, fn] of Object.entries(boundFns)) {
        socket.off(event, fn);
      }
      socketRef.current = null;
    };
  }, [userId]);
  return socketRef;
};