import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import SettingsToggle from "../components/SettingsToggle";

export default function SettingsChats() {
  const { user, patchSettings } = useAuth();
  const [chats, setChats] = useState(user?.settings?.chats || {});

  useEffect(() => {
    setChats(user?.settings?.chats || {});
  }, [user]);

  const update = async (key, value) => {
    const next = { ...chats, [key]: value };
    setChats(next);
    try {
      await patchSettings("chats", next);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Chats" />
      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">Enter is send</p>
          <p className="settings-row-description">
            Pressing Enter sends the message
          </p>
        </div>
        <SettingsToggle
          checked={chats.enterToSend !== false}
          onChange={(v) => update("enterToSend", v)}
        />
      </div>
      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">Media auto-download</p>
          <p className="settings-row-description">
            Download images and files automatically
          </p>
        </div>
        <SettingsToggle
          checked={chats.mediaAutoDownload !== false}
          onChange={(v) => update("mediaAutoDownload", v)}
        />
      </div>
      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">Wallpaper shortcut</p>
          <p className="settings-row-description">
            Quick access from any chat header
          </p>
        </div>
        <SettingsToggle
          checked={chats.wallpaperQuick !== false}
          onChange={(v) => update("wallpaperQuick", v)}
        />
      </div>
    </div>
  );
}