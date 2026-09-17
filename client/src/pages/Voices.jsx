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
  Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

export default function Voices() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/messages/calls/list`)
      .then((r) => setCalls(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="clusters-page">
      <header className="signals-header">
        <h1 className="signals-title">Voices</h1>
      </header>

      <div className="voices-actions">
        <button className="voices-action" aria-label="New voice call">
          <div className="voices-action-icon">
            <Phone className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Call</span>
        </button>
        <button className="voices-action" aria-label="New video call">
          <div className="voices-action-icon">
            <Video className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Video</span>
        </button>
        <button className="voices-action" aria-label="Schedule call">
          <div className="voices-action-icon">
            <Calendar className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Schedule</span>
        </button>
        <button className="voices-action" aria-label="Open keypad">
          <div className="voices-action-icon">
            <Grid3x3 className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="voices-action-label">Keypad</span>
        </button>
      </div>

      {loading ? (
        <p className="text-center text-blue-100/60 text-sm py-8">Loading</p>
      ) : calls.length === 0 ? (
        <div className="signals-empty">
          <p className="text-sm text-blue-100/60 text-center">
            No calls yet. Start one from any thread.
          </p>
        </div>
      ) : (
        <div className="clusters-list">
          {calls.map((c) => {
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
                      isMissed ? "text-red-400" : "text-white"
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
                          : "text-blue-400"
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
    </div>
  );
}