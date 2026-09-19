import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForwardModal({ users, rooms, message, onClose, onForward }) {
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const submit = async () => {
    if (selected.length === 0) return;
    setSending(true);
    try {
      await onForward(selected);
      onClose();
    } catch (err) {
      console.error(err);
      setSending(false);
    }
  };

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-2xl fade-up max-h-[80vh]"
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
          <h3 className="text-base font-bold text-white">Forward to</h3>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-3">
          {rooms.length > 0 && (
            <>
              <p className="pill-label-dark px-2 py-2">Rooms</p>
              {rooms.map((r) => {
                const key = `room:${r._id}`;
                const on = selected.includes(key);
                return (
                  <button
                    key={r._id}
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition"
                  >
                    <div className="w-9 h-9 rounded-full avatar-sapphire flex items-center justify-center">
                      <Users className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <p className="flex-1 text-left text-sm text-white truncate">
                      {r.name}
                    </p>
                    {on && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
          <p className="pill-label-dark px-2 py-2 mt-2">Contacts</p>
          {users.map((u) => {
            const key = `user:${u._id}`;
            const on = selected.includes(key);
            return (
              <button
                key={u._id}
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition"
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
                <p className="flex-1 text-left text-sm text-white truncate">
                  {u.username}
                </p>
                {on && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div
          className="px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
        >
          <button
            onClick={submit}
            disabled={selected.length === 0 || sending}
            className="btn-sapphire w-full disabled:opacity-50"
          >
            {sending ? "Forwarding…" : `Forward to ${selected.length}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}