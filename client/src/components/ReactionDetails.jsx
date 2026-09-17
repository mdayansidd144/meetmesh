import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function ReactionDetails({
  emoji,
  users,
  currentUserId,
  onRemove,
  onClose,
}) {
  if (!users || users.length === 0) return null;

  const initial = (name) => name?.[0]?.toUpperCase() || "?";
  const iAmIn = users.some((u) => u._id === currentUserId);

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm max-h-[80vh] flex flex-col fade-up rounded-2xl"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(255, 255, 255, 0.10)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.10)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <h3 className="text-base font-bold text-white">
              {users.length} {users.length === 1 ? "person" : "people"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-3">
          <div className="space-y-1">
            {users.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition"
              >
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover"
                    style={{ border: "1px solid rgba(255, 255, 255, 0.20)" }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full avatar-sapphire text-xs">
                    {initial(u.username)}
                  </div>
                )}
                <p className="text-sm text-white truncate">{u.username}</p>
              </div>
            ))}
          </div>
        </div>
        {iAmIn && (
          <div
            className="px-3 py-3"
            style={{ borderTop: "1px solid rgba(255, 255, 255, 0.10)" }}
          >
            <button
              onClick={() => onRemove(emoji)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                color: "#fca5a5",
              }}
            >
              Remove my reaction {emoji}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}