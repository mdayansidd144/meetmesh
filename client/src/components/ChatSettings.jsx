import { createPortal } from "react-dom";
import { useRef, useState } from "react";
import { X, Upload, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "sapphire", label: "Sapphire", color: "#60a5fa" },
  { id: "midnight", label: "Midnight", color: "#0f172a" },
  { id: "emerald", label: "Emerald", color: "#22c55e" },
  { id: "rose", label: "Rose", color: "#fb7185" },
  { id: "amber", label: "Amber", color: "#f59e0b" },
  { id: "violet", label: "Violet", color: "#8b5cf6" },
  { id: "slate", label: "Slate", color: "#64748b" },
  { id: "ocean", label: "Ocean", color: "#0891b2" },
];

export default function ChatSettings({
  currentTheme,
  hasBackground,
  onThemeChange,
  onUploadBackground,
  onClearBackground,
  onClose,
}) {
  const [tab, setTab] = useState("theme");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await onUploadBackground(file);
      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
      setUploading(false);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-2xl"
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
          <h3 className="text-base font-bold text-white">Chat appearance</h3>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div
          className="px-5 pt-3 flex gap-2"
          style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.10)" }}
        >
          <button
            onClick={() => setTab("theme")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-t-lg transition",
              tab === "theme"
                ? "text-white border-b-2 border-blue-500"
                : "text-blue-100/60 hover:text-white border-b-2 border-transparent"
            )}
          >
            Color theme
          </button>
          <button
            onClick={() => setTab("wallpaper")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-t-lg transition",
              tab === "wallpaper"
                ? "text-white border-b-2 border-blue-500"
                : "text-blue-100/60 hover:text-white border-b-2 border-transparent"
            )}
          >
            Custom wallpaper
          </button>
        </div>
        {tab === "theme" ? (
          <div className="p-5 grid grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-xl transition",
                  currentTheme === t.id
                    ? "bg-white/10 ring-2 ring-blue-500"
                    : "hover:bg-white/5"
                )}
              >
                <div
                  className="w-12 h-12 rounded-full relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${t.color}33 0%, ${t.color} 100%)`,
                  }}
                >
                  {currentTheme === t.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-white font-medium">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-blue-100/70">
              Upload any image from your device. It will cover the chat body
              with a soft white tint so text stays readable.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-outline-sapphire flex-1 justify-center"
              >
                <Upload className="w-4 h-4" strokeWidth={1.75} />
                {uploading ? "Uploading" : "Choose image"}
              </button>
              {hasBackground && (
                <button
                  onClick={() => onClearBackground()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.30)",
                    color: "#fca5a5",
                  }}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}