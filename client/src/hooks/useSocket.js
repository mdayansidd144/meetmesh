// import { useEffect, useRef } from "react";
// import { io } from "socket.io-client";

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// export const useSocket = (userId, handlers = {}) => {
//   const socketRef = useRef(null);
//   useEffect(() => {
//     if (!userId) return;
//     const socket = io(SOCKET_URL, { transports: ["websocket"] });
//     socketRef.current = socket;
//     socket.on("connect", () => {
//       socket.emit("user:online", userId);
//     });

//     if (handlers.onMessageReceive)
//       socket.on("message:receive", handlers.onMessageReceive);
//     if (handlers.onMessageSent)
//       socket.on("message:sent", handlers.onMessageSent);
//     if (handlers.onUsersOnline)
//       socket.on("users:online", handlers.onUsersOnline);
//     if (handlers.onTypingStart)
//       socket.on("typing:start", handlers.onTypingStart);
//     if (handlers.onTypingStop)
//       socket.on("typing:stop", handlers.onTypingStop);
//     if (handlers.onMessagesRead)
//       socket.on("messages:read", handlers.onMessagesRead);
//     if (handlers.onMessagesDelivered)
//       socket.on("messages:delivered", handlers.onMessagesDelivered);
//     if (handlers.onIncomingCall)
//       socket.on("call:incoming", handlers.onIncomingCall);
//     if (handlers.onRoomMessageReceive)
//       socket.on("room:message:receive", handlers.onRoomMessageReceive);
//     if (handlers.onRoomMessageSent)
//       socket.on("room:message:sent", handlers.onRoomMessageSent);
//     if (handlers.onRoomTypingStart)
//       socket.on("room:typing:start", handlers.onRoomTypingStart);
//     if (handlers.onRoomTypingStop)
//       socket.on("room:typing:stop", handlers.onRoomTypingStop);
//     if (handlers.onReactionUpdate)
//       socket.on("message:reaction:update", handlers.onReactionUpdate);
//     if (handlers.onMessageDeleted)
//       socket.on("message:deleted", handlers.onMessageDeleted);
//     if (handlers.onCallLogNew)
//       socket.on("call:log:new", handlers.onCallLogNew);

//     return () => {
//       socket.disconnect();
//     };
//   }, [userId]);
//   return socketRef;
// };
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const useSocket = (userId, handlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  // Always keep the latest handlers without re-running the connect effect
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
      socket.emit("user:online", userId);
    });

    // Register listeners ONCE — each delegates to the latest handler via ref
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

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return socketRef;
};