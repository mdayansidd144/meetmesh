import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
export default function SignalViewer({ signal, isMine, onClose, onDelete }) {
  if (!signal) return null;
  const initial = (name) => name?.[0]?.toUpperCase() || "?";
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.92)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#0f172e" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          {signal.user?.avatar ? (
            <img
              src={signal.user.avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full avatar-sapphire text-sm">
              {initial(signal.user?.username)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {signal.user?.username}
            </p>
            <p className="text-[11px] text-blue-100/60">
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
              onClick={() => onDelete(signal._id)}
              className="icon-btn-dark"
              aria-label="Delete signal"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        {signal.image && (
          <div className="bg-black flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={signal.image}
              alt=""
              className="max-h-[60vh] w-full object-contain"
            />
          </div>
        )}
        {signal.text && (
          <div className="px-5 py-4">
            <p className="text-sm text-white leading-relaxed break-words">
              {signal.text}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}