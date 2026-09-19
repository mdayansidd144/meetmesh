import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : undefined);
let globalSocket = null;
const getSocket = () => {
  if (globalSocket && globalSocket.connected) return globalSocket;
  if (!SOCKET_URL) return null;

  globalSocket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 10000,
    autoConnect: true,
  });
  globalSocket.on("connect", () => {
    console.log("[socket] connected", globalSocket.id);
  });
  globalSocket.on("disconnect", (reason) =>
    console.log("[socket] disconnected:", reason)
  );
  globalSocket.on("connect_error", (err) =>
    console.error("[socket] connect_error:", err.message)
  );
  globalSocket.io.on("reconnect", () => {
    console.log("[socket] reconnected");
  });

  return globalSocket;
};

export const useSocket = (userId, handlers = {}) => {
  const handlersRef = useRef(handlers);
  const userIdRef = useRef(userId);

  useEffect(() => {
    handlersRef.current = handlers;
    userIdRef.current = userId;
  });

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) {
      console.error("[useSocket] no SOCKET_URL");
      return;
    }

    // Tell server we're online (only if actually connected)
    const announce = () => {
      socket.emit("user:online", userIdRef.current.toString());
      console.log("[socket] announced online:", userIdRef.current);
    };

    if (socket.connected) {
      announce();
    } else {
      socket.once("connect", announce);
    }
    const bound = {};
    const bind = (event, key) => {
      const fn = (...args) => {
        const h = handlersRef.current?.[key];
        if (typeof h === "function") h(...args);
      };
      bound[event] = fn;
      socket.on(event, fn);
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

    // Re-announce when page comes back to focus
    const onFocus = () => {
      if (!socket.connected) {
        socket.connect();
      } else {
        socket.emit("user:online", userIdRef.current.toString());
      }
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      Object.keys(bound).forEach((ev) => socket.off(ev, bound[ev]));
    };
  }, [userId]);

  return { current: globalSocket };
};