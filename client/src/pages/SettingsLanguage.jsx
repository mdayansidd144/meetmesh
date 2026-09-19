import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import { Check } from "lucide-react";
import { setLanguage, getLanguage } from "../i18n";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

export default function SettingsLanguage() {
  const { user, patchSettings } = useAuth();
  const [current, setCurrent] = useState(
    user?.settings?.language || getLanguage() || "en"
  );

  useEffect(() => {
    const lang = user?.settings?.language || getLanguage() || "en";
    setCurrent(lang);
    setLanguage(lang);
  }, [user]);

  const pick = async (code) => {
    setCurrent(code);
    setLanguage(code);
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