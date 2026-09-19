import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function ReadByModal({ readers, onClose }) {
  if (!readers || readers.length === 0) return null;

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm max-h-[70vh] flex flex-col rounded-2xl fade-up"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}
        >
          <h3 className="text-base font-bold text-white">
            Read by · {readers.length}
          </h3>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-1">
          {readers.map((u) => (
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
                />
              ) : (
                <div className="w-9 h-9 rounded-full avatar-sapphire text-xs flex items-center justify-center">
                  {initial(u.username)}
                </div>
              )}
              <p className="text-sm text-white truncate">{u.username}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}