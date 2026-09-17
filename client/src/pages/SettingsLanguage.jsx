import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import { Check } from "lucide-react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

export default function SettingsLanguage() {
  const { user, patchSettings } = useAuth();
  const [current, setCurrent] = useState(user?.settings?.language || "en");

  useEffect(() => {
    setCurrent(user?.settings?.language || "en");
  }, [user]);

  const pick = async (code) => {
    setCurrent(code);
    localStorage.setItem("appLanguage", code);
    try {
      await patchSettings("language", { language: code });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="App language" />
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => pick(l.code)}
          className="settings-row-static w-full text-left"
        >
          <p className="flex-1 settings-row-label">{l.label}</p>
          {current === l.code && (
            <Check className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
          )}
        </button>
      ))}
    </div>
  );
}