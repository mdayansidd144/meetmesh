import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function ScheduleModal({ onClose, onSchedule }) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  const defaultValue = now.toISOString().slice(0, 16);

  const [when, setWhen] = useState(defaultValue);
  const [error, setError] = useState("");

  const submit = () => {
    const date = new Date(when);
    if (date.getTime() <= Date.now()) {
      setError("Pick a time in the future");
      return;
    }
    onSchedule(date.toISOString());
    onClose();
  };

  const quick = (minutes) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    setWhen(d.toISOString().slice(0, 16));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl fade-up"
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
          <h3 className="text-base font-bold text-white">Schedule message</h3>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => quick(5)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-blue-100/70 hover:bg-white/10"
            >
              In 5 min
            </button>
            <button
              onClick={() => quick(30)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-blue-100/70 hover:bg-white/10"
            >
              In 30 min
            </button>
            <button
              onClick={() => quick(60)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-blue-100/70 hover:bg-white/10"
            >
              In 1 hour
            </button>
            <button
              onClick={() => quick(60 * 24)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-blue-100/70 hover:bg-white/10"
            >
              Tomorrow
            </button>
          </div>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="input-dark w-full"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={submit} className="btn-sapphire w-full">
            Schedule send
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}