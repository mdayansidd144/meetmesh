import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const useSocket = (userId, handlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!userId) return;

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
      socket.emit("user:online", userId.toString());
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

    const onFocus = () => {
      if (!socket.connected) socket.connect();
      else socket.emit("user:online", userId.toString());
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });

    return () => {
      window.removeEventListener("focus", onFocus);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return socketRef;
};