import { createPortal } from "react-dom";
import { Reply, Trash2, Star } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥"];

export default function MessageMenu({
  isMine,
  isStarred,
  onReact,
  onReply,
  onDelete,
  onStar,
  position,
}) {
  if (!position) return null;
  return createPortal(
    <div
      className="fixed flex flex-col gap-2"
      style={{ left: position.x, top: position.y, zIndex: 9998 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-full px-2 py-1 flex items-center gap-1 fade-up"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => onReact(e)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-lg transition"
            aria-label={`React with ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div
        className="rounded-xl overflow-hidden fade-up w-44"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <button
          onClick={onReply}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-white hover:bg-white/10 transition text-left"
        >
          <Reply className="w-4 h-4" strokeWidth={1.75} />
          Reply
        </button>
        <button
          onClick={onStar}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-amber-300 hover:bg-white/10 transition text-left border-t border-white/5"
        >
          <Star
            className="w-4 h-4"
            strokeWidth={1.75}
            fill={isStarred ? "currentColor" : "none"}
          />
          {isStarred ? "Unstar" : "Star"}
        </button>
        {isMine && (
          <button
            onClick={onDelete}
            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10 transition text-left border-t border-white/5"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            Delete
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}