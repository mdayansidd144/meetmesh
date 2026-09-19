import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { X, Inbox } from "lucide-react";
const API = import.meta.env.VITE_API_URL;
export default function PendingRequests({ onClose, onAccepted }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const load = () => {
    setLoading(true);
    axios
      .get(`${API}/contacts/pending`)
      .then((r) => setRequests(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const accept = async (requestId) => {
    setActing(requestId);
    try {
      await axios.post(`${API}/contacts/accept/${requestId}`);
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      onAccepted?.();
    } catch (err) {
      console.error(err);
    } finally {
      setActing(null);
    }
  };

  const reject = async (requestId) => {
    setActing(requestId);
    try {
      await axios.post(`${API}/contacts/decline/${requestId}`);
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err) {
      console.error(err);
    } finally {
      setActing(null);
    }
  };

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-2"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >

      <div
        className="w-full max-w-md min-h-[220px] max-h-[90vh] flex flex-col rounded-2xl fade-up"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Inbox className="w-4 h-4" strokeWidth={2} />
            Pending requests
            {requests.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white">
                {requests.length}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body — grows with content, scrolls at 90vh */}
        <div className="flex-1 overflow-y-auto scroll-thin p-3">
          {loading ? (
            <p className="text-xs text-blue-100/60 text-center py-6">
              Loading…
            </p>
          ) : requests.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="w-10 h-10 text-blue-100/30 mx-auto mb-3" />
              <p className="text-sm text-blue-100/60">No pending requests</p>
              <p className="text-[11px] text-blue-100/40 mt-1">
                Requests you receive will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => {
                const busy = acting === r.requestId;
                return (
                  <div
                    key={r.requestId}
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {r.from.avatar ? (
                        <img
                          src={r.from.avatar}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-white/20 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full avatar-sapphire text-base flex items-center justify-center flex-shrink-0">
                          {initial(r.from.username)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {r.from.username}
                        </p>
                        <p className="text-xs text-blue-100/60 mt-0.5 line-clamp-2 break-words">
                          {r.message
                            ? `"${r.message}"`
                            : "Wants to connect with you"}
                        </p>
                        <p className="text-[10px] text-blue-100/40 mt-1">
                          {new Date(r.createdAt).toLocaleString([], {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => accept(r.requestId)}
                        disabled={busy}
                        className="flex-1 py-2 rounded-lg text-sm font-bold text-white transition disabled:opacity-50 active:scale-[0.98]"
                        style={{
                          background:
                            "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                          boxShadow: "0 6px 18px -8px rgba(59,130,246,0.6)",
                        }}
                      >
                        {busy ? "…" : "Accept"}
                      </button>
                      <button
                        onClick={() => reject(r.requestId)}
                        disabled={busy}
                        className="flex-1 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 active:scale-[0.98]"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.08)",
                          color: "rgba(224,231,255,0.85)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        {busy ? "…" : "Reject"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}