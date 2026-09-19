import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import { Check } from "lucide-react";
import { useState } from "react";

const PRIVACY_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "contacts", label: "My contacts" },
  { value: "nobody", label: "Nobody" },
];

function Row({ label, description, value, onChange }) {
  const [open, setOpen] = useState(false);
  const current =
    PRIVACY_OPTIONS.find((o) => o.value === value) || PRIVACY_OPTIONS[0];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="settings-row w-full text-left"
      >
        <div className="settings-row-body">
          <p className="settings-row-label">{label}</p>
          {description && (
            <p className="settings-row-description">{description}</p>
          )}
        </div>
        <span className="text-xs text-blue-100/60">{current.label}</span>
      </button>

      {open && (
        <div className="settings-block">
          {PRIVACY_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={async () => {
                await onChange(o.value);
                setOpen(false);
              }}
              className="settings-row-static w-full text-left"
            >
              <p className="flex-1 settings-row-label">{o.label}</p>
              {value === o.value && (
                <Check className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function SettingsPrivacy() {
  const { user, patchSettings } = useAuth();
  const privacy = user?.settings?.privacy || {};

  const update = (key, value) => patchSettings("privacy", { [key]: value });

  return (
    <div className="settings-page">
      <SettingsHeader title="Privacy" />

      <p className="settings-hint">
        Control who can see your info and how you can be found.
      </p>

      <p className="settings-section-title">Discovery</p>

      <Row
        label="Who can find me by username"
        description="Control whether you appear in username search"
        value={privacy.discoverable || "everyone"}
        onChange={(v) => update("discoverable", v)}
      />

      <Row
        label="Who can find me by email"
        description="Allow people to find you by typing your email or Gmail"
        value={privacy.discoverableByEmail || "everyone"}
        onChange={(v) => update("discoverableByEmail", v)}
      />

      <p className="settings-section-title">Visibility</p>

      <Row
        label="Last seen"
        value={privacy.lastSeen || "everyone"}
        onChange={(v) => update("lastSeen", v)}
      />

      <Row
        label="Profile photo"
        value={privacy.profilePhoto || "everyone"}
        onChange={(v) => update("profilePhoto", v)}
      />

      <Row
        label="About"
        value={privacy.about || "everyone"}
        onChange={(v) => update("about", v)}
      />

      <Row
        label="Status"
        value={privacy.status || "everyone"}
        onChange={(v) => update("status", v)}
      />

      <p className="settings-section-title">Messaging</p>

      <div className="settings-row-static">
        <div className="settings-row-body">
          <p className="settings-row-label">Read receipts</p>
          <p className="settings-row-description">
            If turned off, you won't send or receive read receipts
          </p>
        </div>
        <button
          onClick={() => update("readReceipts", !privacy.readReceipts)}
          className={`settings-toggle ${
            privacy.readReceipts !== false ? "on" : ""
          }`}
          aria-label="Toggle read receipts"
        >
          <span className="settings-toggle-thumb" />
        </button>
      </div>

      <div className="settings-footer">
        Privacy changes take effect immediately.
      </div>
    </div>
  );
}