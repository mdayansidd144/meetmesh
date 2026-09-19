import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import SettingsToggle from "../components/SettingsToggle";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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

export default function SettingsAppearance() {
  const { user, setChatTheme, clearChatBackground } = useAuth();

  // ✅ Local state for light/dark toggle — no ThemeContext dependency
  const [isLight, setIsLight] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("theme-light")
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsLight(el.classList.contains("theme-light"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleLight = () => {
    const el = document.documentElement;
    if (el.classList.contains("theme-light")) {
      el.classList.remove("theme-light");
      localStorage.setItem("theme", "dark");
    } else {
      el.classList.add("theme-light");
      localStorage.setItem("theme", "light");
    }
  };

  const pick = async (id) => {
    await setChatTheme(id);
    await clearChatBackground();
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Appearance" />
      <div className="settings-section-title">Chat theme</div>
      <div className="p-5 grid grid-cols-4 gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-2 rounded-xl transition",
              user?.chatTheme === t.id
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
              {user?.chatTheme === t.id && (
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
      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">Light theme</p>
          <p className="settings-row-description">
            Use a soft grey background across all pages
          </p>
        </div>
        <SettingsToggle checked={isLight} onChange={toggleLight} />
      </div>
    </div>
  );
}