import { useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateRoomModal({ users, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (!name.trim()) return setError("Room name is required");
    if (selected.length === 0) return setError("Pick at least one member");
    setLoading(true);
    try {
      await onCreate(name.trim(), selected);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
      setLoading(false);
    }
  };

  const initial = (n) => n?.[0]?.toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="card-dark w-full max-w-md max-h-[85vh] flex flex-col fade-up">
        <div className="px-5 py-4 divider-dark flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Create room</h2>
          <button onClick={onClose} className="icon-btn-dark" aria-label="Close">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 py-4 divider-dark">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="Room name"
            className="input-dark"
            aria-label="Room name"
          />
        </div>
        <div className="px-5 pt-3 pb-2">
          <p className="pill-label-dark">Select members</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 scroll-thin">
          {users.map((u) => {
            const isSelected = selected.includes(u._id);
            return (
              <button
                key={u._id}
                onClick={() => toggle(u._id)}
                className={cn("contact-row", isSelected && "active")}
                aria-label={`Toggle ${u.username}`}
              >
                <div className="relative flex-shrink-0">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full avatar-sapphire text-base">
                      {initial(u.username)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {u.username}
                  </p>
                  <p className="text-xs text-blue-100/60 truncate">{u.email}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {error && <p className="px-5 pb-2 text-sm text-red-400">{error}</p>}
        <div className="px-5 py-4 divider-dark flex gap-3">
          <button
            onClick={onClose}
            className="btn-outline-sapphire flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="btn-sapphire flex-1"
          >
            {loading ? "Creating" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}