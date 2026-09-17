import { createPortal } from "react-dom";
import { useState } from "react";
import { Bell, X } from "lucide-react";

export default function NotificationPrompt({ onAllow, onDismiss }) {
  const [busy, setBusy] = useState(false);

  const handleAllow = async () => {
    setBusy(true);
    await onAllow();
    setBusy(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 text-center fade-up"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(96, 165, 250, 0.30)",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2 mb-2">
          <button
            onClick={onDismiss}
            className="icon-btn-dark"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-4">
          <Bell className="w-8 h-8" strokeWidth={1.75} />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Stay in the loop</h2>
        <p className="text-sm text-blue-100/70 mb-6">
          Allow MeetMesh to send you notifications when someone messages or
          calls you, even when this tab is in the background.
        </p>

        <div className="space-y-2">
          <button
            onClick={handleAllow}
            disabled={busy}
            className="btn-sapphire w-full"
          >
            {busy ? "Enabling" : "Allow notifications"}
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-200/70 hover:text-white transition"
          >
            Not now
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}