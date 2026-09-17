import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import SettingsToggle from "../components/SettingsToggle";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function SettingsNotifications() {
  const { user, patchSettings } = useAuth();
  const [notif, setNotif] = useState(user?.settings?.notifications || {});
  const [message, setMessage] = useState("");
  const push = usePushNotifications(user);

  useEffect(() => {
    setNotif(user?.settings?.notifications || {});
  }, [user]);

  const update = async (key, value) => {
    setMessage("");
    if (key === "browser" && value) {
      const ok = await push.enable();
      if (!ok) {
        setMessage("Permission denied or not supported");
        return;
      }
    }
    if (key === "browser" && !value) {
      await push.disable();
    }
    const next = { ...notif, [key]: value };
    setNotif(next);
    try {
      await patchSettings("notifications", next);
    } catch (err) {
      console.error(err);
    }
  };

  const sendTest = async () => {
    const sent = await push.test();
    setMessage(
      sent > 0 ? `Test sent to ${sent} device(s)` : "No subscription found"
    );
  };

  const rows = [
    ["messages", "Message notifications", "Alerts for new direct messages"],
    ["groups", "Group notifications", "Alerts for room and group messages"],
    ["calls", "Call notifications", "Alerts for incoming voice and video calls"],
    ["sounds", "Notification sounds", "Play a sound with each alert"],
  ];

  return (
    <div className="settings-page">
      <SettingsHeader title="Notifications" />

      {!push.supported && (
        <p className="settings-hint">
          This browser does not support push notifications.
        </p>
      )}

      {rows.map(([key, label, desc]) => (
        <div key={key} className="settings-row-static">
          <div className="flex-1">
            <p className="settings-row-label">{label}</p>
            <p className="settings-row-description">{desc}</p>
          </div>
          <SettingsToggle
            checked={notif[key] !== false}
            onChange={(v) => update(key, v)}
          />
        </div>
      ))}

      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">Browser notifications</p>
          <p className="settings-row-description">
            System notifications when the tab is in the background
          </p>
        </div>
        <SettingsToggle
          checked={!!notif.browser && push.subscribed}
          onChange={(v) => update("browser", v)}
          disabled={!push.supported || push.busy}
        />
      </div>

      {push.subscribed && (
        <div className="settings-block">
          <button
            onClick={sendTest}
            className="btn-outline-sapphire w-full justify-center"
          >
            Send test notification
          </button>
        </div>
      )}

      {message && <p className="settings-message">{message}</p>}
    </div>
  );
}