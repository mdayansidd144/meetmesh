import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : undefined);
export const useSocket = (userId, handlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  const userIdRef = useRef(userId);
  useEffect(() => {
    handlersRef.current = handlers;
    userIdRef.current = userId;
  });

  useEffect(() => {
    if (!userId) return;
    if (!SOCKET_URL) {
      console.error("[useSocket] VITE_SOCKET_URL is missing");
      return;
    }
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
      socket.emit("user:online", userIdRef.current.toString());
    });
    socket.on("disconnect", (reason) =>
      console.log("[socket] disconnected:", reason)
    );
    socket.on("connect_error", (err) =>
      console.error("[socket] connect_error:", err.message)
    );
    socket.io.on("reconnect", () => {
      console.log("[socket] reconnected");
      socket.emit("user:online", userIdRef.current.toString());
    });

    const bind = (event, key) => {
      socket.on(event, (...args) => {
        const fn = handlersRef.current?.[key];
        if (typeof fn === "function") fn(...args);
      });
    };

    bind("message:receive", "onMessageReceive");
    bind("message:sent", "onMessageSent");
    bind("users:online", "onUsersOnline");
    bind("typing:start", "onTypingStart");
    bind("typing:stop", "onTypingStop");
    bind("messages:read", "onMessagesRead");
    bind("messages:delivered", "onMessagesDelivered");
    bind("call:incoming", "onIncomingCall");
    bind("room:message:receive", "onRoomMessageReceive");
    bind("room:message:sent", "onRoomMessageSent");
    bind("room:typing:start", "onRoomTypingStart");
    bind("room:typing:stop", "onRoomTypingStop");
    bind("message:reaction:update", "onReactionUpdate");
    bind("message:deleted", "onMessageDeleted");
    bind("call:log:new", "onCallLogNew");
    bind("room:read:update", "onRoomReadUpdate");
    bind("scheduled:queued", "onScheduledQueued");
    bind("scheduled:flushed", "onScheduledFlushed");
    bind("request:received", "onRequestReceived");
    bind("request:accepted", "onRequestAccepted");
    bind("request:declined", "onRequestDeclined");

    const onFocus = () => {
      if (!socket.connected) socket.connect();
      else socket.emit("user:online", userIdRef.current.toString());
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      console.log("[useSocket] cleanup");
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      [
        "connect", "disconnect", "connect_error",
        "message:receive", "message:sent", "users:online",
        "typing:start", "typing:stop",
        "messages:read", "messages:delivered",
        "call:incoming",
        "room:message:receive", "room:message:sent",
        "room:typing:start", "room:typing:stop",
        "message:reaction:update", "message:deleted", "call:log:new",
        "room:read:update", "scheduled:queued", "scheduled:flushed",
        "request:received", "request:accepted", "request:declined",
      ].forEach((ev) => socket.off(ev));
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return socketRef;
};