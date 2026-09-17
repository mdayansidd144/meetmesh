import { createPortal } from "react-dom";
import { useEffect } from "react";
import { X, MessageCircle, Phone } from "lucide-react";

const ICONS = {
  message: MessageCircle,
  call: Phone,
};

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icon = ICONS[toast.type] || MessageCircle;

  return createPortal(
    <div className="fixed top-4 right-4 z-[300] pointer-events-none">
      <div
        className="pointer-events-auto w-80 rounded-2xl p-4 flex items-start gap-3 fade-up"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(96, 165, 250, 0.30)",
          boxShadow: "0 20px 40px -12px rgba(0,0,0,0.7)",
        }}
        onClick={() => {
          toast.onClick?.();
          onClose();
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-300 flex-shrink-0">
          <Icon className="w-5 h-5" strokeWidth={1.9} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{toast.title}</p>
          <p className="text-xs text-blue-100/70 mt-0.5 truncate">
            {toast.body}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-blue-200/50 hover:text-white transition"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body
  );
}