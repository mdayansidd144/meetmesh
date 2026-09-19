import { useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactPickerModal({
  users,
  onlineIds,
  onClose,
  onPick,
  mode, // "voice" | "video"
}) {
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase()),
  );

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl fade-up"
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
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {mode === "video" ? (
              <Video className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Phone className="w-4 h-4" strokeWidth={2} />
            )}
            {mode === "video" ? "Start video call" : "Start voice call"}
          </h3>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="search-pill-dark flex items-center">
            <Search className="w-4 h-4 text-blue-200/70" strokeWidth={1.75} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="text-xs text-blue-100/50 text-center py-6">
              No contacts match "{query}"
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((u) => {
                const isOnline = onlineIds?.includes(u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => onPick(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition"
                  >
                    <div className="relative flex-shrink-0">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full avatar-sapphire flex items-center justify-center">
                          {initial(u.username)}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#0f172e]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-white truncate">
                        {u.username}
                      </p>
                      <p
                        className={cn(
                          "text-[11px]",
                          isOnline ? "text-blue-400" : "text-blue-100/50",
                        )}
                      >
                        {isOnline ? "Active in mesh" : "Offline"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[11px] text-blue-100/40 text-center py-3 border-t border-white/5">
          Only online contacts can receive calls
        </p>
      </div>
    </div>,
    document.body,
  );
}