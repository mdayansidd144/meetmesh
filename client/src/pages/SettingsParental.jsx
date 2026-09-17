import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import SettingsToggle from "../components/SettingsToggle";

export default function SettingsParental() {
  const { user, patchSettings } = useAuth();
  const [enabled, setEnabled] = useState(
    !!user?.settings?.parental?.enabled
  );
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setEnabled(!!user?.settings?.parental?.enabled);
  }, [user]);

  const save = async (nextEnabled) => {
    if (nextEnabled && (!pin || pin.length !== 4)) {
      setStatus("Enter a 4-digit PIN");
      return;
    }
    try {
      await patchSettings("parental", { enabled: nextEnabled, pin });
      setEnabled(nextEnabled);
      setPin("");
      setStatus(nextEnabled ? "PIN lock enabled" : "PIN lock disabled");
    } catch (err) {
      setStatus("Failed");
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Parental controls" />
      <p className="settings-hint">
        Require a PIN each time MeetMesh opens on this device.
      </p>
      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">PIN lock</p>
          <p className="settings-row-description">
            Ask for a 4-digit code on app open
          </p>
        </div>
        <SettingsToggle checked={enabled} onChange={save} />
      </div>
      {!enabled && (
        <div className="settings-block">
          <p className="settings-label">Set 4-digit PIN</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="input-dark"
            placeholder="0000"
          />
          <button onClick={() => save(true)} className="btn-sapphire w-full mt-3">
            Enable PIN lock
          </button>
        </div>
      )}
      {status && <p className="settings-message">{status}</p>}
    </div>
  );
}