import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Video,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Calendar,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ContactPickerModal from "../components/ContactPickerModal";
import NewChatModal from "../components/NewChatModal";

const API = import.meta.env.VITE_API_URL;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "missed", label: "Missed" },
  { id: "outgoing", label: "Outgoing" },
  { id: "incoming", label: "Incoming" },
];

export default function Voices() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [pickerMode, setPickerMode] = useState(null); // "voice" | "video" | null
  const [showNewChat, setShowNewChat] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/messages/calls/list`),
      axios.get(`${API}/auth/users`),
    ])
      .then(([callsRes, usersRes]) => {
        setCalls(callsRes.data);
        setUsers(usersRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handlePickContact = (contact) => {
    setPickerMode(null);
    navigate("/", {
      state: {
        openContactId: contact._id,
        startCall: pickerMode,
      },
    });
  };

  const openChat = (contactId) => {
    navigate("/", { state: { openContactId: contactId } });
  };

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  const formatDuration = (sec) => {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const filteredCalls = calls.filter((c) => {
    if (filter === "all") return true;
    if (filter === "missed") {
      return (
        c.callMeta?.status === "missed" || c.callMeta?.status === "declined"
      );
    }
    if (filter === "outgoing") return c.direction === "outgoing";
    if (filter === "incoming") return c.direction === "incoming";
    return true;
  });

  return (
    <div className="clusters-page">
      <header className="signals-header">
        <h1 className="signals-title">Voices</h1>
      </header>

      {/* Action buttons — Call / Video / Schedule / Search */}
      <div className="voices-actions">
        <button
          className="voices-action"
          aria-label="New voice call"
          onClick={() => setPickerMode("voice")}
        >
          <div className="voices-action-icon">
            <Phone className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Call</span>
        </button>
        <button
          className="voices-action"
          aria-label="New video call"
          onClick={() => setPickerMode("video")}
        >
          <div className="voices-action-icon">
            <Video className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Video</span>
        </button>
        <button
          className="voices-action"
          aria-label="Schedule call"
          onClick={() =>
            showToast("Scheduling is coming soon — start a call from any chat")
          }
        >
          <div className="voices-action-icon">
            <Calendar className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Schedule</span>
        </button>
        <button
          className="voices-action"
          aria-label="Find a contact"
          onClick={() => setShowNewChat(true)}
        >
          <div className="voices-action-icon">
            <Search className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Find</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition",
                active
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-blue-100/70 hover:bg-white/10",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-center text-blue-100/60 text-sm py-8">Loading</p>
      ) : filteredCalls.length === 0 ? (
        <div className="signals-empty">
          <p className="text-sm text-blue-100/60 text-center">
            {filter === "all"
              ? "No calls yet. Tap Call or Video above to start one."
              : `No ${filter} calls.`}
          </p>
        </div>
      ) : (
        <div className="clusters-list">
          {filteredCalls.map((c) => {
            const other = c.other;
            const isVideo = c.type === "call_video";
            const isMissed =
              c.callMeta?.status === "missed" ||
              c.callMeta?.status === "declined";
            const isOutgoing = c.direction === "outgoing";
            const ArrowIcon = isMissed
              ? PhoneMissed
              : isOutgoing
                ? PhoneOutgoing
                : PhoneIncoming;
            const TrailIcon = isVideo ? Video : Phone;
            return (
              <button
                key={c._id}
                onClick={() => other?._id && openChat(other._id)}
                className="cluster-row"
              >
                <div className="relative flex-shrink-0">
                  {other?.avatar ? (
                    <img
                      src={other.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full avatar-sapphire text-base">
                      {initial(other?.username)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={cn(
                      "text-sm font-semibold truncate",
                      isMissed ? "text-red-400" : "text-white",
                    )}
                  >
                    {other?.username || "Unknown"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ArrowIcon
                      className={cn(
                        "w-3.5 h-3.5 flex-shrink-0",
                        isMissed
                          ? "text-red-400"
                          : isOutgoing
                            ? "text-green-400"
                            : "text-blue-400",
                      )}
                      strokeWidth={2.5}
                    />
                    <p className="text-xs text-blue-100/60 truncate">
                      {new Date(c.createdAt).toLocaleString([], {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {c.callMeta?.duration > 0 &&
                        ` · ${formatDuration(c.callMeta.duration)}`}
                    </p>
                  </div>
                </div>
                <TrailIcon
                  className="w-5 h-5 text-blue-200/60 flex-shrink-0"
                  strokeWidth={1.75}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Contact picker for Call / Video */}
      {pickerMode && (
        <ContactPickerModal
          users={users}
          onlineIds={onlineIds}
          mode={pickerMode}
          onClose={() => setPickerMode(null)}
          onPick={handlePickContact}
        />
      )}

      {/* Find / New chat modal */}
      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-xl text-sm text-white"
          style={{
            backgroundColor: "rgba(15, 23, 46, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}