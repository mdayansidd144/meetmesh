import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function SignalViewer({ signal, onClose, onDelete }) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);

  if (!signal) return null;

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  const isMine =
    String(signal?.user?._id || "") === String(user?._id || "");

  const handleDelete = async () => {
    await onDelete(signal._id);
    setConfirming(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: "#000" }}
      onClick={onClose}
    >
      {/* ── Top bar: avatar + name + time + close ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 safe-top"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0">
          {signal.user?.avatar ? (
            <img
              src={signal.user.avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full avatar-sapphire text-sm">
              {initial(signal.user?.username)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {signal.user?.username}
          </p>
          <p className="text-[11px] text-white/70">
            {new Date(signal.createdAt).toLocaleString([], {
              hour: "2-digit",
              minute: "2-digit",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>

        {isMine && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
            className="icon-btn-dark"
            aria-label="Delete signal"
            title="Delete signal"
            style={{
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
        <button
          onClick={onClose}
          className="icon-btn-dark"
          aria-label="Close"
          style={{
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* ── Main content: fills the rest of the screen ── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {signal.image ? (
          <img
            src={signal.image}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center px-8"
            style={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #0f172e 50%, #1e1b4b 100%)",
            }}
          >
            <p className="text-2xl md:text-3xl text-white leading-relaxed break-words text-center max-w-3xl">
              {signal.text}
            </p>
          </div>
        )}
      </div>

      {/* ── Text caption below the image (WhatsApp-style) ── */}
      {signal.image && signal.text && (
        <div
          className="px-6 pb-8 pt-4 safe-bottom"
          style={{
            background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-base text-white leading-relaxed break-words text-center max-w-2xl mx-auto">
            {signal.text}
          </p>
        </div>
      )}

      {/* ── Delete confirmation overlay ── */}
      {confirming && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{
              backgroundColor: "#0f172e",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-white mb-2">
              Delete this signal?
            </p>
            <p className="text-sm text-blue-100/70 mb-6">
              It will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="btn-outline-sapphire flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.30)",
                  color: "#fca5a5",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}