import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n";
import ReactionDetails from "../components/ReactionDetails";
import { useSocket } from "../hooks/useSocket";
import { useDebounce } from "../hooks/useDebounce";
import { useInChatSearch } from "../hooks/useInChatSearch";
import { cn, colorForUsername } from "@/lib/utils";
import VideoCall from "../components/VideoCall";
import GroupCall from "../components/GroupCall";
import CreateRoomModal from "../components/CreateRoomModal";
import MessageStatus from "../components/MessageStatus";
import MessageMenu from "../components/MessageMenu";
import CallCard from "../components/CallCard";
import NotificationPrompt from "../components/NotificationPrompt";
import AttachmentView from "../components/AttachmentView";
import ChatSettings from "../components/ChatSettings";
import BottomNav from "../components/BottomNav";
import ChatMenu from "../components/ChatMenu";
import Toast from "../components/Toast";
import SearchResults from "../components/SearchResults";
import ConnectionBadge from "../components/ConnectionBadge";
import ForwardModal from "../components/ForwardModal";
import ReadByModal from "../components/ReadByModal";
import ScheduleModal from "../components/ScheduleModal";
import InChatSearchBar from "../components/InChatSearchBar";
import NewChatModal from "../components/NewChatModal";
import PendingRequests from "../components/PendingRequests";
import ZenithGlyph from "../components/ZenithGlyph";
import { usePushNotifications } from "../hooks/usePushNotifications";
import Signals from "./Signals";
import Clusters from "./Clusters";
import Voices from "./Voices";
import {
  Search,
  Video,
  Phone,
  MoreVertical,
  Paperclip,
  Send,
  ArrowLeft,
  Plus,
  Users,
  X,
  Mic,
  Square,
  Palette,
  User,
  Clock,
  UserPlus,
  Inbox,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const makeTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function Chat() {
  const { user, setChatTheme, setChatBackground, clearChatBackground } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [tab, setTab] = useState("threads");
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [conversations, setConversations] = useState({});
  const [roomPreviews, setRoomPreviews] = useState({});
  const [onlineIds, setOnlineIds] = useState([]);
  const [active, setActive] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [msgResults, setMsgResults] = useState([]);
  const [searchingMsgs, setSearchingMsgs] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [roomTyping, setRoomTyping] = useState("");
  const [call, setCall] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [menu, setMenu] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [reactionDetails, setReactionDetails] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [starredSet, setStarredSet] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [recording, setRecording] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationPromptChecked, setNotificationPromptChecked] =
    useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(true);

  const [forwardMessage, setForwardMessage] = useState(null);
  const [readByMessage, setReadByMessage] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const [showNewChat, setShowNewChat] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [aiUser, setAiUser] = useState(null);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // ✅ NEW — Group call state
  const [groupCallRoom, setGroupCallRoom] = useState(null);

  const [isLight, setIsLight] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("theme-light")
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsLight(el.classList.contains("theme-light"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const push = usePushNotifications(user);
  const debouncedSearch = useDebounce(search, 300);

  const typingTimeout = useRef(null);
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeRef = useRef(null);
  const activeRoomRef = useRef(null);
  const usersRef = useRef([]);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  activeRef.current = active;
  activeRoomRef.current = activeRoom;
  usersRef.current = users;

  const inChat = useInChatSearch(messages, messagesContainerRef);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping, roomTyping]);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    axios
      .get(`${API}/settings/starred`)
      .then((r) => {
        const ids = new Set(r.data.map((m) => m._id));
        setStarredSet(ids);
      })
      .catch(() => {});
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    axios
      .get(`${API}/ai/me`)
      .then((r) => setAiUser(r.data))
      .catch(() => {});
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id || notificationPromptChecked) return;
    if (push?.supported === false) {
      setNotificationPromptChecked(true);
      return;
    }
    const key = `notificationPromptShown:${user._id}`;
    const already = localStorage.getItem(key);
    if (already === "1") {
      setNotificationPromptChecked(true);
      return;
    }
    if (push?.subscribed) {
      localStorage.setItem(key, "1");
      setNotificationPromptChecked(true);
      return;
    }
    const timer = setTimeout(() => {
      setShowNotificationPrompt(true);
      setNotificationPromptChecked(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [user?._id, push?.supported, push?.subscribed, notificationPromptChecked]);

  useEffect(() => {
    if (!location.state) return;
    if (location.state.openRoomId && rooms.length > 0) {
      const room = rooms.find((r) => r._id === location.state.openRoomId);
      if (room) {
        setTab("threads");
        setActiveRoom(room);
        setActive(null);
      }
      window.history.replaceState({}, "");
    } else if (location.state.openContactId && users.length > 0) {
      const contact = users.find((u) => u._id === location.state.openContactId);
      if (contact) {
        setTab("threads");
        setActive(contact);
        setActiveRoom(null);
      }
      window.history.replaceState({}, "");
    }
  }, [location.state, rooms, users]);

  useEffect(() => {
    if (
      !location.state?.startCall ||
      !location.state?.openContactId ||
      !active
    ) {
      return;
    }
    if (active._id !== location.state.openContactId) return;
    if (!onlineIds.includes(active._id)) {
      alert("This user is offline");
      window.history.replaceState({}, "");
      return;
    }
    const isVideo = location.state.startCall === "video";
    setCall({ role: "caller", peer: active, video: isVideo });
    window.history.replaceState({}, "");
  }, [active, location.state, onlineIds]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
  }, []);

  useEffect(() => {
    const handlePop = () => {
      if (tab !== "threads") {
        window.history.pushState(null, "", window.location.href);
        setTab("threads");
        return;
      }
      if (activeRef.current || activeRoomRef.current) {
        window.history.pushState(null, "", window.location.href);
        setActive(null);
        setActiveRoom(null);
        setMessages([]);
        setPeerTyping(false);
        setRoomTyping("");
        setReplyTo(null);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [tab]);

  useEffect(() => {
    if (!user?._id) return;
    const q = debouncedSearch.trim();
    if (q.length < 2) {
      setMsgResults([]);
      setSearchingMsgs(false);
      return;
    }
    let cancelled = false;
    setSearchingMsgs(true);
    axios
      .get(`${API}/messages/search`, { params: { q } })
      .then((r) => {
        if (!cancelled) setMsgResults(r.data.results || []);
      })
      .catch(() => {
        if (!cancelled) setMsgResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchingMsgs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    const q = debouncedSearch.trim();

    if (q.length < 2 || q.includes("@")) {
      setUserSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    let cancelled = false;
    setSearchingUsers(true);

    axios
      .get(`${API}/contacts/search`, { params: { q } })
      .then((r) => {
        if (!cancelled) setUserSearchResults(r.data.results || []);
      })
      .catch(() => {
        if (!cancelled) setUserSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    const onFocus = () => {
      if (activeRef.current && !activeRoomRef.current) {
        socketRef.current?.emit("messages:read", {
          reader: user._id,
          sender: activeRef.current._id,
        });
      }
      if (activeRoomRef.current) {
        socketRef.current?.emit("room:messages:read", {
          reader: user._id,
          roomId: activeRoomRef.current._id,
        });
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    const loadCount = () => {
      axios
        .get(`${API}/contacts/pending`)
        .then((r) => setPendingCount(r.data.length))
        .catch(() => {});
    };
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  const getSenderId = useCallback((m) => {
    if (!m.sender) return "";
    if (typeof m.sender === "object" && m.sender._id) {
      return m.sender._id.toString();
    }
    return m.sender.toString();
  }, []);

  const refetchCurrent = useCallback(() => {
    if (activeRoomRef.current) {
      axios
        .get(`${API}/rooms/${activeRoomRef.current._id}/messages`)
        .then((r) =>
          setMessages((prev) =>
            r.data.map((m) => {
              const existing = prev.find((p) => p._id === m._id);
              if (existing && existing.status === "read") {
                return { ...m, status: "read" };
              }
              return {
                ...m,
                status: m.read ? "read" : m.delivered ? "delivered" : "sent",
              };
            })
          )
        )
        .catch((err) => console.error(err));
    } else if (activeRef.current) {
      axios
        .get(`${API}/messages/${activeRef.current._id}`)
        .then((r) =>
          setMessages((prev) =>
            r.data.map((m) => {
              const existing = prev.find((p) => p._id === m._id);
              if (existing && existing.status === "read") {
                return { ...m, status: "read" };
              }
              return {
                ...m,
                status: m.read ? "read" : m.delivered ? "delivered" : "sent",
              };
            })
          )
        )
        .catch((err) => console.error(err));
    }
  }, []);

  const handleMessageReceive = useCallback(
    (msg) => {
      const senderFromList = usersRef.current.find((u) => u._id === msg.sender);
      const isMine = msg.sender === user._id;
      const senderIdStr = msg.sender?.toString?.() || msg.sender;

      setConversations((prev) => {
        const otherId = senderIdStr === user._id ? msg.receiver : senderIdStr;
        const current = prev[otherId] || { unread: 0 };
        const isActive = activeRef.current?._id === otherId;
        return {
          ...prev,
          [otherId]: {
            lastMessage: msg.type === "text" ? msg.text : "Attachment",
            lastAt: msg.createdAt,
            unread: isActive ? 0 : (current.unread || 0) + 1,
          },
        };
      });

      const activeId =
        activeRef.current?._id?.toString?.() || activeRef.current?._id;
      const isOpen =
        activeId && !activeRoomRef.current && activeId === senderIdStr;

      if (isOpen) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, { ...msg, status: "sent" }];
        });
        socketRef.current?.emit("messages:read", {
          reader: user._id,
          sender: senderIdStr,
        });
      } else if (!isMine && !activeId) {
        setToast({
          type: "message",
          title: senderFromList?.username || "New message",
          body:
            msg.type === "text"
              ? msg.text
              : msg.type === "attachment"
              ? "Sent an attachment"
              : "New message",
          onClick: () => {
            setTab("threads");
            const contact = usersRef.current.find((u) => u._id === msg.sender);
            if (contact) {
              setActive(contact);
              setActiveRoom(null);
            }
          },
        });
      }
    },
    [user._id]
  );

  const handleMessageSent = useCallback((msg) => {
    const tempId = msg.tempId;
    if (tempId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? {
                ...msg,
                tempId: undefined,
                status: msg.delivered ? "delivered" : "sent",
              }
            : m
        )
      );
    }
  }, []);

  const handleUsersOnline = useCallback((ids) => {
    setOnlineIds(ids);
  }, []);

  const handleTypingStart = useCallback(({ from }) => {
    if (activeRef.current && activeRef.current._id === from) {
      setPeerTyping(true);
    }
  }, []);

  const handleTypingStop = useCallback(({ from }) => {
    if (activeRef.current && activeRef.current._id === from) {
      setPeerTyping(false);
    }
  }, []);

  const handleMessagesRead = useCallback(
    ({ by }) => {
      setMessages((prev) =>
        prev.map((m) =>
          getSenderId(m) === user._id && m.receiver === by
            ? { ...m, read: true, delivered: true, status: "read" }
            : m
        )
      );
    },
    [user._id, getSenderId]
  );

  const handleMessagesDelivered = useCallback(
    ({ by }) => {
      setMessages((prev) =>
        prev.map((m) =>
          getSenderId(m) === user._id && m.receiver === by
            ? {
                ...m,
                delivered: true,
                status: m.read ? "read" : "delivered",
              }
            : m
        )
      );
    },
    [user._id, getSenderId]
  );

  const handleIncomingCall = useCallback(
    ({ from, offer, callerName, video }) => {
      setToast({
        type: "call",
        title: `${callerName || "Someone"} is calling`,
        body: video ? "Incoming video call" : "Incoming voice call",
        onClick: () => {
          setTab("threads");
          const contact = usersRef.current.find((u) => u._id === from);
          if (contact) {
            setActive(contact);
            setActiveRoom(null);
          }
        },
      });
      setCall({
        role: "callee",
        peer: { _id: from, username: callerName },
        incomingOffer: offer,
        video,
      });
    },
    []
  );

  const handleRoomMessageReceive = useCallback(
    (msg) => {
      setRoomPreviews((prev) => ({
        ...prev,
        [msg.room]: {
          lastMessage: msg.type === "text" ? msg.text : "Attachment",
          lastAt: msg.createdAt,
        },
      }));

      if (activeRoomRef.current && activeRoomRef.current._id === msg.room) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, { ...msg, status: "sent" }];
        });
        socketRef.current?.emit("room:messages:read", {
          reader: user._id,
          roomId: msg.room,
        });
      } else {
        setToast({
          type: "message",
          title: "New group message",
          body:
            msg.type === "text"
              ? msg.text
              : msg.type === "attachment"
              ? "Sent an attachment"
              : "New message",
        });
      }
    },
    [user._id]
  );

  const handleRoomMessageSent = useCallback((msg) => {
    const tempId = msg.tempId;
    if (tempId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? { ...msg, tempId: undefined, status: "sent" }
            : m
        )
      );
    }
  }, []);

  const handleRoomTypingStart = useCallback(({ username }) => {
    setRoomTyping(`${username} is typing`);
  }, []);

  const handleRoomTypingStop = useCallback(() => {
    setRoomTyping("");
  }, []);

  const handleReactionUpdate = useCallback(({ messageId, reactions }) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
    );
  }, []);

  const handleMessageDeleted = useCallback(({ messageId }) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  const handleCallLogNew = useCallback(
    (msg) => {
      const currentRoom = activeRoomRef.current;
      const currentPeer = activeRef.current;
      const belongsHere =
        (currentRoom && msg.room === currentRoom._id) ||
        (currentPeer &&
          !currentRoom &&
          (msg.sender?._id === currentPeer._id ||
            msg.receiver === currentPeer._id));
      if (belongsHere) refetchCurrent();
    },
    [refetchCurrent]
  );

  const handleRoomReadUpdate = useCallback(
    ({ reader, roomId }) => {
      if (!activeRoomRef.current || activeRoomRef.current._id !== roomId) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (getSenderId(m) === reader) return m;
          const existing = m.readBy || [];
          if (existing.includes(reader)) return m;
          return { ...m, readBy: [...existing, reader] };
        })
      );
    },
    [getSenderId]
  );

  const handleScheduledQueued = useCallback(({ tempId, messageId }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.tempId === tempId
          ? { ...m, tempId: undefined, _id: messageId, scheduled: true }
          : m
      )
    );
  }, []);

  const handleScheduledFlushed = useCallback(({ messageId }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId ? { ...m, scheduled: false, status: "sent" } : m
      )
    );
  }, []);

  const socketRef = useSocket(user?._id, {
    onMessageReceive: handleMessageReceive,
    onMessageSent: handleMessageSent,
    onUsersOnline: handleUsersOnline,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
    onMessagesRead: handleMessagesRead,
    onMessagesDelivered: handleMessagesDelivered,
    onIncomingCall: handleIncomingCall,
    onRoomMessageReceive: handleRoomMessageReceive,
    onRoomMessageSent: handleRoomMessageSent,
    onRoomTypingStart: handleRoomTypingStart,
    onRoomTypingStop: handleRoomTypingStop,
    onReactionUpdate: handleReactionUpdate,
    onMessageDeleted: handleMessageDeleted,
    onCallLogNew: handleCallLogNew,
  });

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    s.on("room:read:update", handleRoomReadUpdate);
    s.on("scheduled:queued", handleScheduledQueued);
    s.on("scheduled:flushed", handleScheduledFlushed);
    return () => {
      s.off("room:read:update", handleRoomReadUpdate);
      s.off("scheduled:queued", handleScheduledQueued);
      s.off("scheduled:flushed", handleScheduledFlushed);
    };
  }, [
    socketRef.current,
    handleRoomReadUpdate,
    handleScheduledQueued,
    handleScheduledFlushed,
  ]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    const onReceived = () => setPendingCount((c) => c + 1);
    const onAccepted = () => {
      axios.get(`${API}/auth/users`).then((r) => setUsers(r.data));
      setToast({
        type: "message",
        title: "Request accepted",
        body: "You can now chat with this contact",
      });
    };
    const onDeclined = () => {
      setToast({
        type: "message",
        title: "Request declined",
        body: "Your contact request was declined",
      });
    };
    s.on("request:received", onReceived);
    s.on("request:accepted", onAccepted);
    s.on("request:declined", onDeclined);
    return () => {
      s.off("request:received", onReceived);
      s.off("request:accepted", onAccepted);
      s.off("request:declined", onDeclined);
    };
  }, [socketRef.current]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    setSocketConnected(s.connected);
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [socketRef.current]);

  useEffect(() => {
    if (!user?._id) return;
    setLoadingUsers(true);
    Promise.all([
      axios.get(`${API}/auth/users`),
      axios.get(`${API}/messages/conversations/list`),
      axios.get(`${API}/rooms`),
    ])
      .then(([uRes, cRes, rRes]) => {
        setUsers(uRes.data);
        setRooms(rRes.data);
        const map = {};
        cRes.data.forEach((c) => {
          map[c.contactId] = {
            lastMessage: c.lastMessage,
            lastAt: c.lastAt,
            unread: c.unread,
          };
        });
        setConversations(map);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingUsers(false));
  }, [user?._id]);

  useEffect(() => {
    if (!active || !user?._id) return;
    setLoadingMessages(true);
    setPeerTyping(false);
    setReplyTo(null);
    setConversations((prev) => ({
      ...prev,
      [active._id]: { ...(prev[active._id] || {}), unread: 0 },
    }));
    axios
      .get(`${API}/messages/${active._id}`)
      .then((r) => {
        const fetched = r.data.map((m) => ({
          ...m,
          status: m.read ? "read" : m.delivered ? "delivered" : "sent",
        }));
        setMessages((prev) => {
          const map = new Map();
          [...prev, ...fetched].forEach((m) => map.set(m._id, m));
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
        socketRef.current?.emit("messages:read", {
          reader: user._id,
          sender: active._id,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingMessages(false));
  }, [active, user?._id]);

  useEffect(() => {
    if (!activeRoom || !user?._id) return;
    setLoadingMessages(true);
    setRoomTyping("");
    setReplyTo(null);
    socketRef.current?.emit("room:join", { roomId: activeRoom._id });
    axios
      .get(`${API}/rooms/${activeRoom._id}/messages`)
      .then((r) => {
        const fetched = r.data.map((m) => ({ ...m, status: "sent" }));
        setMessages((prev) => {
          const map = new Map();
          [...prev, ...fetched].forEach((m) => map.set(m._id, m));
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
        socketRef.current?.emit("room:messages:read", {
          reader: user._id,
          roomId: activeRoom._id,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingMessages(false));

    return () => {
      if (activeRoomRef.current) {
        socketRef.current?.emit("room:leave", {
          roomId: activeRoomRef.current._id,
        });
      }
    };
  }, [activeRoom, user?._id]);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post(`${API}/attachments/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendWithAttachment(data);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        const duration = recordingTime;
        setRecordingTime(0);
        const formData = new FormData();
        formData.append("duration", duration);
        formData.append("file", file);
        setUploading(true);
        try {
          const { data } = await axios.post(
            `${API}/attachments/upload`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          sendWithAttachment(data);
        } catch (err) {
          console.error("Voice upload failed", err);
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const sendWithAttachment = (attachment) => {
    if (!socketRef.current) return;
    const tempId = makeTempId();
    const tempMessage = {
      _id: tempId,
      tempId,
      sender: user,
      receiver: active?._id || null,
      room: activeRoom?._id || null,
      text: "",
      createdAt: new Date().toISOString(),
      status: "sending",
      type: "attachment",
      attachment,
      replyTo: replyTo
        ? {
            _id: replyTo._id,
            text: replyTo.deletedAt ? "Message deleted" : replyTo.text,
            sender: replyTo.sender,
            type: replyTo.type,
          }
        : null,
      reactions: [],
    };

    setMessages((prev) => [...prev, tempMessage]);

    const payload = {
      sender: user._id,
      text: "",
      tempId,
      replyTo: replyTo?._id || null,
      attachment,
    };

    if (activeRoom) {
      socketRef.current.emit("room:message:send", {
        ...payload,
        roomId: activeRoom._id,
      });
    } else if (active) {
      socketRef.current.emit("message:send", {
        ...payload,
        receiver: active._id,
      });
    }
    setReplyTo(null);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    const tempId = makeTempId();
    const tempMessage = {
      _id: tempId,
      tempId,
      sender: user,
      receiver: active?._id || null,
      room: activeRoom?._id || null,
      text,
      createdAt: new Date().toISOString(),
      status: "sending",
      type: "text",
      attachment: null,
      replyTo: replyTo
        ? {
            _id: replyTo._id,
            text: replyTo.deletedAt ? "Message deleted" : replyTo.text,
            sender: replyTo.sender,
            type: replyTo.type,
          }
        : null,
      reactions: [],
    };

    setMessages((prev) => [...prev, tempMessage]);

    const payload = {
      sender: user._id,
      text,
      tempId,
      replyTo: replyTo?._id || null,
      attachment: null,
    };

    if (activeRoom) {
      socketRef.current.emit("room:message:send", {
        ...payload,
        roomId: activeRoom._id,
      });
      socketRef.current.emit("room:typing:stop", {
        sender: user._id,
        roomId: activeRoom._id,
      });
    } else if (active) {
      socketRef.current.emit("message:send", {
        ...payload,
        receiver: active._id,
      });
      socketRef.current.emit("typing:stop", {
        sender: user._id,
        receiver: active._id,
      });
    }
    setText("");
    setReplyTo(null);
  };

  const handleForward = async (targets) => {
    if (!forwardMessage || !socketRef.current) return;
    for (const t of targets) {
      const isRoom = t.startsWith("room:");
      const targetId = t.split(":")[1];
      const tempId = makeTempId();
      const payload = {
        sender: user._id,
        text: forwardMessage.text || "",
        tempId,
        replyTo: null,
        attachment: forwardMessage.attachment || null,
        forwardedFrom: forwardMessage._id,
      };
      if (isRoom) {
        socketRef.current.emit("room:message:send", {
          ...payload,
          roomId: targetId,
        });
      } else {
        socketRef.current.emit("message:send", {
          ...payload,
          receiver: targetId,
        });
      }
    }
  };

  const sendScheduled = (isoTime) => {
    if (!text.trim() || !socketRef.current) return;
    const tempId = makeTempId();
    const tempMessage = {
      _id: tempId,
      tempId,
      sender: user,
      receiver: active?._id || null,
      room: activeRoom?._id || null,
      text,
      createdAt: new Date().toISOString(),
      status: "sending",
      type: "text",
      attachment: null,
      replyTo: null,
      reactions: [],
      scheduled: true,
      scheduledFor: isoTime,
    };
    setMessages((prev) => [...prev, tempMessage]);

    const payload = {
      sender: user._id,
      text,
      tempId,
      replyTo: null,
      attachment: null,
      scheduledFor: isoTime,
    };
    if (activeRoom) {
      socketRef.current.emit("room:message:send", {
        ...payload,
        roomId: activeRoom._id,
      });
    } else if (active) {
      socketRef.current.emit("message:send", {
        ...payload,
        receiver: active._id,
      });
    }
    setText("");
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    if (!socketRef.current) return;

    if (activeRoom) {
      socketRef.current.emit("room:typing:start", {
        sender: user._id,
        roomId: activeRoom._id,
        username: user.username,
      });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socketRef.current?.emit("room:typing:stop", {
          sender: user._id,
          roomId: activeRoom._id,
        });
      }, 1500);
    } else if (active) {
      socketRef.current.emit("typing:start", {
        sender: user._id,
        receiver: active._id,
      });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socketRef.current?.emit("typing:stop", {
          sender: user._id,
          receiver: active._id,
        });
      }, 1500);
    }
  };

  const startCall = (video) => {
    if (!active) return;
    if (!onlineIds.includes(active._id)) {
      alert("This user is offline");
      return;
    }
    setCall({ role: "caller", peer: active, video });
  };

  const handleLogCall = ({ type, status, duration }) => {
    if (!socketRef.current) return;
    socketRef.current.emit("call:log", {
      sender: user._id,
      receiver: active?._id || null,
      roomId: activeRoom?._id || null,
      type,
      status,
      duration,
    });
  };

  const handleCreateRoom = async (name, memberIds) => {
    const { data } = await axios.post(`${API}/rooms`, { name, memberIds });
    setRooms((prev) => [data, ...prev]);
    setShowCreateRoom(false);
    setActiveRoom(data);
    setActive(null);
  };

  const selectContact = (u) => {
    setActive(u);
    setActiveRoom(null);
  };

  const selectRoom = (r) => {
    setActiveRoom(r);
    setActive(null);
  };

  const jumpToSearchResult = (result) => {
    setSearch("");
    setMsgResults([]);

    if (result.isRoom) {
      const room = rooms.find((r) => r._id === result.room._id);
      if (room) {
        setTab("threads");
        setActiveRoom(room);
        setActive(null);
      }
    } else {
      const peer = users.find((u) => u._id === result.peer?._id);
      if (peer) {
        setTab("threads");
        setActive(peer);
        setActiveRoom(null);
      }
    }

    setHighlightMessageId(result._id);
    setTimeout(() => setHighlightMessageId(null), 2500);
  };

  const openUserFromSearch = (u) => {
    if (u.status === "accepted") {
      const contact = users.find((x) => x._id === u._id);
      if (contact) {
        setSearch("");
        setUserSearchResults([]);
        setTab("threads");
        setActive(contact);
        setActiveRoom(null);
        return;
      }
    }
    setShowNewChat(true);
  };

  const getSenderName = (m) => {
    if (m.sender && typeof m.sender === "object" && m.sender.username) {
      return m.sender.username;
    }
    const found = users.find((u) => u._id === getSenderId(m));
    if (found) return found.username;
    if (getSenderId(m) === user._id) return user.username;
    return "User";
  };

  const sortedUsers = useMemo(() => {
    const filtered = users.filter((u) =>
      u.username.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const aAt = conversations[a._id]?.lastAt || 0;
      const bAt = conversations[b._id]?.lastAt || 0;
      return new Date(bAt) - new Date(aAt);
    });
  }, [users, search, conversations]);

  const sortedRooms = useMemo(() => {
    const filtered = rooms.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const aAt = roomPreviews[a._id]?.lastAt || 0;
      const bAt = roomPreviews[b._id]?.lastAt || 0;
      return new Date(bAt) - new Date(aAt);
    });
  }, [rooms, search, roomPreviews]);

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const headerPeer = active || activeRoom;
  const headerIsRoom = !!activeRoom;

  const showSenderName = (m, index) => {
    if (getSenderId(m) === user._id) return false;
    if (index === 0) return true;
    const prev = messages[index - 1];
    return getSenderId(prev) !== getSenderId(m);
  };

  const handleReaction = async (messageId, emoji) => {
    setMenu(null);
    try {
      await axios.post(`${API}/reactions/${messageId}`, { emoji });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveReaction = async (emoji) => {
    if (!reactionDetails) return;
    const messageId = reactionDetails.messageId;
    setReactionDetails(null);
    try {
      await axios.post(`${API}/reactions/${messageId}`, { emoji });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (messageId) => {
    setMenu(null);
    try {
      await axios.delete(`${API}/reactions/${messageId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = (m) => {
    setMenu(null);
    setReplyTo(m);
  };

  const handleStar = async (messageId) => {
    const isCurrentlyStarred = starredSet.has(messageId);
    setMenu(null);
    try {
      await axios.put(`${API}/settings/star/${messageId}`, {
        starred: !isCurrentlyStarred,
      });
      setStarredSet((prev) => {
        const next = new Set(prev);
        if (isCurrentlyStarred) next.delete(messageId);
        else next.add(messageId);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const openMenu = (e, m) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 220);
    const y = Math.max(rect.top - 90, 10);
    setMenu({ message: m, position: { x, y } });
  };

  const groupReactions = (reactions) => {
    if (!reactions || reactions.length === 0) return [];
    const map = new Map();
    reactions.forEach((r) => {
      const userObj =
        r.user && typeof r.user === "object"
          ? r.user
          : { _id: r.user, username: "User" };
      const key = r.emoji;
      const entry = map.get(key) || { emoji: key, users: [], mine: false };
      entry.users.push(userObj);
      if (userObj._id === user._id) entry.mine = true;
      map.set(key, entry);
    });
    return Array.from(map.values());
  };

  const closeChat = () => {
    setActive(null);
    setActiveRoom(null);
    setMessages([]);
    setPeerTyping(false);
    setRoomTyping("");
    setReplyTo(null);
  };

  const handleEnableNotifications = async () => {
    const ok = await push.enable();
    if (user?._id) {
      localStorage.setItem(`notificationPromptShown:${user._id}`, "1");
    }
    setShowNotificationPrompt(false);
    return ok;
  };

  const handleDismissNotificationPrompt = () => {
    if (user?._id) {
      localStorage.setItem(`notificationPromptShown:${user._id}`, "1");
    }
    setShowNotificationPrompt(false);
  };

  const openReadBy = (m) => {
    const ids = m.readBy || [];
    const readers = ids
      .map(
        (id) => users.find((u) => u._id === id) || { _id: id, username: "User" }
      )
      .filter(Boolean);
    setReadByMessage({ readers });
  };

  const sidebarHidden = !!headerPeer;

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <div className="bg-canvas" />
      {tab === "signals" && <Signals />}
      {tab === "clusters" && <Clusters />}
      {tab === "voices" && <Voices />}

      {tab !== "threads" && (
        <div
          className="fixed top-0 right-0 z-[60] flex items-center gap-1 px-4 py-4 safe-top"
          style={{ pointerEvents: "auto" }}
        >
          <button
            onClick={() => navigate("/profile")}
            className="icon-btn-dark"
            aria-label="Open profile"
            title="Profile"
          >
            <User className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowChatMenu(true);
            }}
            className="icon-btn-dark"
            aria-label="More options"
            title="Menu"
          >
            <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      <div
        className={cn(
          "threads-shell",
          tab === "threads" ? "threads-shell-active" : "threads-shell-hidden"
        )}
      >
        <aside
          className={cn(
            "flex flex-col card-dark sidebar-mobile pb-20",
            sidebarHidden && "hidden-mobile"
          )}
        >
          <div className="px-5 py-5 divider-dark flex items-center gap-3 safe-top">
            <div className="w-11 h-11 rounded-xl logo-sapphire text-lg">M</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold brand-sapphire leading-tight">
                MeetMesh
              </h1>
              <p className="text-xs text-blue-100/60 truncate">
                {t("app.tagline")}
              </p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="icon-btn-dark"
              aria-label="Open profile"
              title="Profile"
            >
              <User className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowChatMenu(true);
              }}
              className="icon-btn-dark"
              aria-label="More options"
              title="Menu"
            >
              <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          {aiUser && (
            <button
              onClick={() => navigate("/ai")}
              className="mx-5 mt-3 mb-2 flex items-center gap-3 px-4 py-3 rounded-2xl transition text-left"
              style={
                isLight
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(6,182,212,0.08) 60%, rgba(244,63,94,0.08) 100%)",
                      border: "1px solid rgba(139,92,246,0.30)",
                    }
                  : {
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.10) 60%, rgba(244,63,94,0.12) 100%)",
                      border: "1px solid rgba(139,92,246,0.30)",
                    }
              }
              aria-label="Ask Zenith AI"
            >
              <ZenithGlyph size={32} />
              <span
                className="flex-1 text-sm font-medium"
                style={{ color: isLight ? "#0b1220" : "#e0e7ff" }}
              >
                {t("zenith.pill")}
              </span>
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{
                  color: isLight
                    ? "rgba(15,23,42,0.55)"
                    : "rgba(165,180,252,0.60)",
                }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}

          <div className="px-5 py-4 divider-dark flex gap-2">
            <div className="search-pill-dark flex-1">
              <Search className="w-4 h-4 text-blue-200/70" strokeWidth={1.75} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("chat.search.placeholder")}
                aria-label={t("chat.search.placeholder")}
              />
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="icon-btn-dark"
              aria-label={t("chat.newChat.tooltip")}
              title={t("chat.newChat.tooltip")}
            >
              <UserPlus className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => setShowPending(true)}
              className="icon-btn-dark relative"
              aria-label={t("chat.pending.tooltip")}
              title={t("chat.pending.tooltip")}
            >
              <Inbox className="w-4 h-4" strokeWidth={2} />
              {pendingCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="icon-btn-dark"
              aria-label={t("chat.createRoom.tooltip")}
              title={t("chat.createRoom.tooltip")}
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {search.trim().length >= 2 && (
            <div className="px-3 pb-3 divider-dark">
              <SearchResults
                loading={searchingMsgs}
                results={msgResults}
                query={search}
                currentUserId={user._id}
                users={users}
                onSelect={jumpToSearchResult}
              />

              {!search.includes("@") &&
                (searchingUsers || userSearchResults.length > 0) && (
                  <div className="mt-3">
                    <p className="pill-label-dark px-2 pb-1">
                      People on MeetMesh
                    </p>

                    {searchingUsers && userSearchResults.length === 0 && (
                      <p className="text-xs text-blue-100/50 px-2 py-2">
                        Searching…
                      </p>
                    )}

                    {userSearchResults.map((u) => {
                      const isAccepted = u.status === "accepted";
                      const isPending =
                        u.status === "outgoing-pending" ||
                        u.status === "incoming-pending";

                      return (
                        <button
                          key={u._id}
                          onClick={() => openUserFromSearch(u)}
                          className="contact-row"
                        >
                          <div className="relative flex-shrink-0">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-11 h-11 rounded-full object-cover border border-white/20"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full avatar-sapphire text-base">
                                {u.username?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">
                              {u.username}
                            </p>
                            <p className="text-xs text-blue-100/65 truncate mt-0.5">
                              {isAccepted
                                ? "Already a contact — tap to chat"
                                : isPending
                                ? u.status === "outgoing-pending"
                                  ? "Request pending"
                                  : "Sent you a request"
                                : "Tap to send a request"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 pb-4 scroll-thin">
            <div className="px-2 pt-2 pb-1 flex items-center justify-between">
              <p className="pill-label-dark">{t("chat.section.rooms")}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-100 font-bold">
                {sortedRooms.length}
              </span>
            </div>
            {sortedRooms.length === 0 ? (
              <p className="text-xs text-blue-100/50 text-center py-2">
                {t("chat.empty.rooms")}
              </p>
            ) : (
              <div className="space-y-1">
                {sortedRooms.map((r) => {
                  const selected = activeRoom?._id === r._id;
                  const preview = roomPreviews[r._id] || {};
                  return (
                    <button
                      key={r._id}
                      onClick={() => selectRoom(r)}
                      className={cn("contact-row", selected && "active")}
                      aria-label={`Open room ${r.name}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full avatar-sapphire">
                          <Users className="w-5 h-5" strokeWidth={2} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {r.name}
                          </p>
                          {preview.lastAt && (
                            <span className="text-[10px] text-blue-100/55 font-medium flex-shrink-0">
                              {formatTime(preview.lastAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-100/65 truncate mt-0.5">
                          {preview.lastMessage ||
                            t("chat.header.members", {
                              n: r.members.length,
                            })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="px-2 pt-4 pb-1 flex items-center justify-between">
              <p className="pill-label-dark">{t("chat.section.dms")}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-100 font-bold">
                {sortedUsers.length}
              </span>
            </div>
            {loadingUsers ? (
              <p className="text-xs text-blue-100/60 text-center py-4">
                {t("chat.loading")}
              </p>
            ) : sortedUsers.length === 0 ? (
              <div className="text-center py-6 px-3">
                <p className="text-xs text-blue-100/60 mb-2">
                  {t("chat.empty.dms")}
                </p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="text-xs text-blue-400 font-semibold hover:text-blue-300"
                >
                  {t("chat.empty.startChat")}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedUsers.map((u) => {
                  const isOnline = onlineIds.includes(u._id);
                  const selected = active?._id === u._id;
                  const conv = conversations[u._id] || {};
                  return (
                    <button
                      key={u._id}
                      onClick={() => selectContact(u)}
                      className={cn("contact-row", selected && "active")}
                      aria-label={`Open chat with ${u.username}`}
                    >
                      <div className="relative flex-shrink-0">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-11 h-11 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div
                            className={cn(
                              "w-11 h-11 rounded-full avatar-sapphire text-base",
                              !isOnline && "avatar-offline-sapphire"
                            )}
                          >
                            {initial(u.username)}
                          </div>
                        )}
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full dot-online-sapphire border-2 border-[#0f172e]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {u.username}
                          </p>
                          {conv.lastAt && (
                            <span className="text-[10px] text-blue-100/55 font-medium flex-shrink-0">
                              {formatTime(conv.lastAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-blue-100/65 truncate">
                            {conv.lastMessage ||
                              (isOnline
                                ? t("chat.status.active")
                                : t("chat.status.offline"))}
                          </p>
                          {conv.unread > 0 && (
                            <span className="badge-count-sapphire flex-shrink-0">
                              {conv.unread > 9 ? "9+" : conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="px-5 py-3 divider-dark text-[10px] text-blue-100/45 text-center safe-bottom">
            {t("chat.footer")}
          </div>
        </aside>

        <main
          className={cn(
            "flex flex-col card-light chat-mobile",
            !headerPeer && "hidden-mobile"
          )}
        >
          {headerPeer ? (
            <>
              <header className="px-4 py-4 chat-header-tint relative z-10 flex justify-between items-center safe-top">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeChat();
                    }}
                    className="icon-btn-light"
                    aria-label={t("chat.welcome.back")}
                  >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  <div className="relative flex-shrink-0">
                    {headerIsRoom ? (
                      <div className="w-11 h-11 rounded-full avatar-sapphire">
                        <Users className="w-5 h-5" strokeWidth={2} />
                      </div>
                    ) : active.avatar ? (
                      <img
                        src={active.avatar}
                        alt=""
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full avatar-sapphire text-base">
                        {initial(active.username)}
                      </div>
                    )}
                    {!headerIsRoom && onlineIds.includes(active._id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
                      {headerIsRoom ? activeRoom.name : active.username}
                    </h2>
                    <p
                      className={cn(
                        "text-xs font-medium truncate",
                        roomTyping || peerTyping
                          ? "text-blue-600"
                          : headerIsRoom
                          ? "text-slate-500"
                          : onlineIds.includes(active._id)
                          ? "text-blue-600"
                          : "text-slate-500"
                      )}
                    >
                      {headerIsRoom
                        ? roomTyping ||
                          t("chat.header.members", {
                            n: activeRoom.members.length,
                          })
                        : peerTyping
                        ? t("chat.header.typing")
                        : onlineIds.includes(active._id)
                        ? t("chat.header.active")
                        : t("chat.header.lastSeen")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="icon-btn-white"
                    aria-label="Chat appearance"
                    title="Chat appearance"
                  >
                    <Palette className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  {headerIsRoom && (
                    <button
                      onClick={() => setGroupCallRoom(activeRoom._id)}
                      className="icon-btn-white"
                      aria-label="Start group call"
                      title="Start group call"
                    >
                      <Video className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  )}
                  {!headerIsRoom && (
                    <>
                      <button
                        onClick={() => startCall(false)}
                        className="icon-btn-white"
                        aria-label="Voice call"
                      >
                        <Phone className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => startCall(true)}
                        className="icon-btn-white"
                        aria-label="Video call"
                      >
                        <Video className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => setShowChatMenu(true)}
                        className="icon-btn-white"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                    </>
                  )}
                </div>
              </header>

              {inChat.open && (
                <InChatSearchBar
                  query={inChat.query}
                  onQueryChange={inChat.setQuery}
                  matchCount={inChat.matches.length}
                  currentIndex={inChat.currentIndex}
                  onNext={inChat.next}
                  onPrev={inChat.prev}
                  onClose={inChat.close}
                />
              )}

              <div
                className={cn(
                  "flex-1 scroll-thin-light relative overflow-hidden",
                  !user?.chatBackground &&
                    `chat-surface-split chat-theme-${
                      user?.chatTheme || "sapphire"
                    }`
                )}
                style={
                  user?.chatBackground
                    ? {
                        backgroundImage: `url(${user.chatBackground})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                {user?.chatBackground && <div className="chat-wallpaper" />}
                <div
                  ref={messagesContainerRef}
                  className="chat-surface-content h-full overflow-y-auto px-4 py-6 scroll-thin-light"
                >
                  {loadingMessages ? (
                    <p className="text-center text-slate-400 text-sm">
                      {t("chat.loading")}
                    </p>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center fade-up">
                      <div className="w-24 h-24 rounded-3xl logo-sapphire logo-float text-5xl">
                        M
                      </div>
                      <h2 className="mt-6 text-2xl text-white drop-shadow-md">
                        {headerIsRoom
                          ? t("chat.welcome.room", { name: activeRoom.name })
                          : t("chat.welcome.sayHi", { name: active.username })}
                      </h2>
                      <p className="text-sm text-white/85 mt-2 max-w-sm">
                        {t("chat.welcome.subtitle")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {messages.map((m, index) => {
                        const mine = getSenderId(m) === user._id;
                        const showName = showSenderName(m, index);
                        const senderName = getSenderName(m);
                        const reactionChips = groupReactions(m.reactions);
                        const isCall =
                          m.type === "call_voice" || m.type === "call_video";
                        const isHighlight = inChat.highlightId === m._id;
                        const readByCount = (m.readBy || []).filter(
                          (id) => id !== user._id
                        ).length;
                        return (
                          <div key={m._id} data-message-id={m._id}>
                            {showName && (
                              <div
                                className={cn(
                                  "flex items-center gap-2 mt-3 mb-1",
                                  mine ? "justify-end" : "justify-start"
                                )}
                              >
                                <p
                                  className="text-[12px] font-bold"
                                  style={{
                                    color: colorForUsername(senderName),
                                  }}
                                >
                                  {senderName}
                                </p>
                              </div>
                            )}
                            <div
                              className={cn(
                                "flex flex-col",
                                mine ? "items-end" : "items-start"
                              )}
                            >
                              {isCall ? (
                                <CallCard message={m} mine={mine} />
                              ) : (
                                <div
                                  onContextMenu={(e) => openMenu(e, m)}
                                  className={cn(
                                    "max-w-[80%] px-4 py-2.5 text-sm weave-in cursor-context-menu transition-all duration-500",
                                    mine
                                      ? "bubble-out-sapphire"
                                      : "bubble-in-on-sapphire",
                                    m.status === "sending" && "opacity-75",
                                    (highlightMessageId === m._id ||
                                      isHighlight) &&
                                      "ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent"
                                  )}
                                >
                                  {m.forwardedFrom && (
                                    <p
                                      className={cn(
                                        "text-[10px] italic mb-1",
                                        mine
                                          ? "text-white/70"
                                          : "text-slate-500"
                                      )}
                                    >
                                      Forwarded
                                    </p>
                                  )}
                                  {m.replyTo && (
                                    <div
                                      className={cn(
                                        "mb-2",
                                        mine ? "reply-bar-out" : "reply-bar-in"
                                      )}
                                    >
                                      <p
                                        className={cn(
                                          "text-[11px] font-bold",
                                          mine ? "text-white" : "text-blue-600"
                                        )}
                                      >
                                        {m.replyTo.sender?.username || "User"}
                                      </p>
                                      <p
                                        className={cn(
                                          "text-[12px] truncate",
                                          mine
                                            ? "text-white/85"
                                            : "text-slate-700"
                                        )}
                                      >
                                        {m.replyTo.type &&
                                        m.replyTo.type !== "text"
                                          ? "Attachment"
                                          : m.replyTo.deletedAt
                                          ? "Message deleted"
                                          : m.replyTo.text}
                                      </p>
                                    </div>
                                  )}
                                  {m.attachment && (
                                    <AttachmentView
                                      attachment={m.attachment}
                                      mine={mine}
                                    />
                                  )}
                                  {m.text && (
                                    <p className="leading-relaxed break-words">
                                      {m.text}
                                    </p>
                                  )}
                                  <div
                                    className={cn(
                                      "text-[10px] mt-1 flex items-center justify-end gap-1 font-medium",
                                      mine ? "text-white/70" : "text-slate-500"
                                    )}
                                  >
                                    {m.scheduled && (
                                      <span title="Scheduled">
                                        <Clock
                                          className="w-3 h-3"
                                          strokeWidth={2}
                                        />
                                      </span>
                                    )}
                                    {starredSet.has(m._id) && (
                                      <span className="text-amber-300">★</span>
                                    )}
                                    <span>
                                      {new Date(m.createdAt).toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                    </span>
                                    {mine && !headerIsRoom && (
                                      <MessageStatus status={m.status} />
                                    )}
                                  </div>
                                </div>
                              )}
                              {headerIsRoom && readByCount > 0 && (
                                <button
                                  onClick={() => openReadBy(m)}
                                  className={cn(
                                    "text-[10px] mt-0.5 underline-offset-2 hover:underline",
                                    mine
                                      ? "text-slate-500 mr-1"
                                      : "text-slate-500 ml-1"
                                  )}
                                >
                                  Seen by {readByCount}
                                </button>
                              )}
                              {reactionChips.length > 0 && (
                                <div
                                  className={cn(
                                    "flex gap-1 -mt-1 z-10",
                                    mine ? "mr-2" : "ml-2"
                                  )}
                                >
                                  {reactionChips.map((chip) => (
                                    <button
                                      key={chip.emoji}
                                      onClick={() =>
                                        setReactionDetails({
                                          messageId: m._id,
                                          emoji: chip.emoji,
                                          users: chip.users,
                                        })
                                      }
                                      onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (chip.mine) {
                                          handleReaction(m._id, chip.emoji);
                                        }
                                      }}
                                      className={cn(
                                        "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 bg-white border shadow-md transition hover:scale-110",
                                        chip.mine
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-slate-200"
                                      )}
                                    >
                                      <span>{chip.emoji}</span>
                                      {chip.users.length > 1 && (
                                        <span className="text-[10px] text-slate-600 font-bold">
                                          {chip.users.length}
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {peerTyping && !headerIsRoom && (
                        <div className="flex justify-start mt-2">
                          <div className="bubble-in-on-sapphire px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messageEndRef} />
                    </div>
                  )}
                </div>
              </div>

              {replyTo && (
                <div className="px-3 pt-3 bg-white">
                  <div className="reply-preview-composer flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-blue-600">
                        {replyTo.sender?.username || "User"}
                      </p>
                      <p className="text-[12px] text-slate-600 truncate">
                        {replyTo.type && replyTo.type !== "text"
                          ? "Attachment"
                          : replyTo.deletedAt
                          ? "Message deleted"
                          : replyTo.text}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="icon-btn-light"
                      aria-label="Cancel reply"
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="px-3 py-3 bg-white relative z-10 safe-bottom"
              >
                <div className="chat-input-bar-light">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || recording}
                    className="icon-btn-light"
                    aria-label={t("chat.input.attach")}
                  >
                    <Paperclip className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    onChange={handleFilePick}
                    className="hidden"
                  />
                  {recording ? (
                    <>
                      <span className="flex-1 text-sm text-red-500 font-medium animate-pulse px-2">
                        Recording {Math.floor(recordingTime / 60)}:
                        {(recordingTime % 60).toString().padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="w-11 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                        aria-label={t("chat.input.stopRecord")}
                      >
                        <Square
                          className="w-4 h-4"
                          fill="currentColor"
                          strokeWidth={0}
                        />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        value={text}
                        onChange={handleTextChange}
                        placeholder={t("chat.input.placeholder", {
                          name: headerIsRoom
                            ? activeRoom.name
                            : active.username,
                        })}
                        aria-label={t("chat.input.aria")}
                      />
                      {text.trim() ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowSchedule(true)}
                            className="icon-btn-light"
                            aria-label={t("chat.input.schedule")}
                            title={t("chat.input.schedule")}
                          >
                            <Clock className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="submit"
                            className="send-btn-sapphire"
                            aria-label="Send message"
                          >
                            <Send className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          disabled={uploading}
                          className="w-11 h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                          aria-label={t("chat.input.record")}
                        >
                          <Mic className="w-4 h-4" strokeWidth={2} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 fade-up">
              <div className="w-28 h-28 rounded-3xl logo-sapphire logo-float text-6xl">
                M
              </div>
              <h2 className="mt-8 text-4xl brand-sapphire-inverse">
                {t("chat.welcome.title")}
              </h2>
              <p className="text-sm text-slate-500 mt-3 max-w-md">
                {t("chat.welcome.body")}
              </p>
              <p className="text-xs text-slate-400 mt-8 italic">
                {t("app.tagline")}
              </p>
            </div>
          )}
        </main>
      </div>

      {tab === "threads" && !headerPeer && (
        <div className="fixed bottom-32 right-5 z-50 flex flex-col items-end gap-3">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform active:scale-95 hover:scale-105 bg-white"
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            }}
            aria-label={t("chat.newChat.tooltip")}
            title={t("chat.newChat.tooltip")}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f172e"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="9" x2="18" y2="9" />
              <polyline points="14 5 18 9 14 13" />
              <line x1="6" y1="15" x2="20" y2="15" />
              <polyline points="10 11 6 15 10 19" />
            </svg>
          </button>

          <button
            onClick={() => navigate("/ai")}
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform active:scale-95 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #0A0A1A 0%, #1A0A2A 100%)",
              border: "2px solid rgba(139,92,246,0.6)",
              boxShadow:
                "0 10px 36px rgba(139,92,246,0.45), 0 0 24px rgba(6,182,212,0.25)",
            }}
            aria-label="Ask Zenith AI"
            title="Ask Zenith AI"
          >
            <ZenithGlyph size={40} />
          </button>
        </div>
      )}

      {menu && (
        <MessageMenu
          isMine={getSenderId(menu.message) === user._id}
          isStarred={starredSet.has(menu.message._id)}
          onReact={(emoji) => handleReaction(menu.message._id, emoji)}
          onReply={() => handleReply(menu.message)}
          onForward={() => {
            setForwardMessage(menu.message);
            setMenu(null);
          }}
          onDelete={() => handleDelete(menu.message._id)}
          onStar={() => handleStar(menu.message._id)}
          position={menu.position}
        />
      )}

      {reactionDetails && (
        <ReactionDetails
          emoji={reactionDetails.emoji}
          users={reactionDetails.users}
          currentUserId={user._id}
          onRemove={handleRemoveReaction}
          onClose={() => setReactionDetails(null)}
        />
      )}

      {forwardMessage && (
        <ForwardModal
          users={users}
          rooms={rooms}
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
          onForward={handleForward}
        />
      )}

      {readByMessage && (
        <ReadByModal
          readers={readByMessage.readers}
          onClose={() => setReadByMessage(null)}
        />
      )}

      {showSchedule && (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onSchedule={sendScheduled}
        />
      )}

      {showCreateRoom && (
        <CreateRoomModal
          users={users}
          onClose={() => setShowCreateRoom(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onRequestSent={() => {}}
        />
      )}

      {showPending && (
        <PendingRequests
          onClose={() => setShowPending(false)}
          onAccepted={() => {
            axios.get(`${API}/auth/users`).then((r) => setUsers(r.data));
          }}
        />
      )}

      {showSettings && (
        <ChatSettings
          currentTheme={user?.chatTheme || "sapphire"}
          hasBackground={!!user?.chatBackground}
          onThemeChange={async (theme) => {
            await setChatTheme(theme);
            await clearChatBackground();
          }}
          onUploadBackground={setChatBackground}
          onClearBackground={clearChatBackground}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showChatMenu && (
        <ChatMenu
          onClose={() => setShowChatMenu(false)}
          onSelect={(action) => {
            if (action.type === "create-room") setShowCreateRoom(true);
            if (action.type === "create-broadcast") navigate("/broadcasts");
            if (action.type === "read-all") {
              setConversations((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach((k) => {
                  next[k] = { ...next[k], unread: 0 };
                });
                return next;
              });
            }
          }}
        />
      )}

      {call && (
        <VideoCall
          role={call.role}
          peer={call.peer}
          incomingOffer={call.incomingOffer}
          video={call.video}
          socketRef={socketRef}
          userId={user._id}
          callerName={user.username}
          onClose={() => setCall(null)}
          logCall={handleLogCall}
        />
      )}

      {groupCallRoom && (
        <GroupCall
          roomName={`room-${groupCallRoom}`}
          onClose={() => setGroupCallRoom(null)}
        />
      )}

      {!headerPeer && <BottomNav active={tab} onChange={setTab} unread={{}} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {showNotificationPrompt && (
        <NotificationPrompt
          onAllow={handleEnableNotifications}
          onDismiss={handleDismissNotificationPrompt}
        />
      )}
      <ConnectionBadge connected={socketConnected} />
    </div>
  );
}