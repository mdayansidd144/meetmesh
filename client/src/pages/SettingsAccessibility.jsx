import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import SettingsToggle from "../components/SettingsToggle";

export default function SettingsAccessibility() {
  const { user, patchSettings } = useAuth();
  const [acc, setAcc] = useState(
    user?.settings?.accessibility || {
      fontSize: "medium",
      highContrast: false,
      reducedMotion: false,
    }
  );

  useEffect(() => {
    setAcc(
      user?.settings?.accessibility || {
        fontSize: "medium",
        highContrast: false,
        reducedMotion: false,
      }
    );
  }, [user]);

  const update = async (key, value) => {
    const next = { ...acc, [key]: value };
    setAcc(next);
    try {
      await patchSettings("accessibility", next);
      if (key === "fontSize") {
        document.documentElement.setAttribute("data-font-size", value);
      }
      if (key === "highContrast") {
        document.documentElement.classList.toggle("high-contrast", value);
      }
      if (key === "reducedMotion") {
        document.documentElement.classList.toggle("reduced-motion", value);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sizes = [
    ["small", "Small"],
    ["medium", "Medium"],
    ["large", "Large"],
  ];

  return (
    <div className="settings-page">
      <SettingsHeader title="Accessibility" />
      <div className="settings-block">
        <p className="settings-label">Font size</p>
        <div className="flex gap-2 mt-2">
          {sizes.map(([k, label]) => (
            <button
              key={k}
              onClick={() => update("fontSize", k)}
              className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition ${
                acc.fontSize === k
                  ? "bg-blue-500/20 border-blue-500 text-white"
                  : "bg-white/5 border-white/10 text-blue-100/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">High contrast</p>
          <p className="settings-row-description">
            Boost contrast for readability
          </p>
        </div>
        <SettingsToggle
          checked={!!acc.highContrast}
          onChange={(v) => update("highContrast", v)}
        />
      </div>
      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">Reduced motion</p>
          <p className="settings-row-description">
            Disable animations and transitions
          </p>
        </div>
        <SettingsToggle
          checked={!!acc.reducedMotion}
          onChange={(v) => update("reducedMotion", v)}
        />
      </div>
    </div>
  );
}