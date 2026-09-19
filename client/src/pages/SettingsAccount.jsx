import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";

export default function SettingsAccount() {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile({ username, bio });
      setMessage("Saved");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const signOutAll = () => {
    if (window.confirm("Sign out from all devices?")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const deleteAccount = () => {
    if (
      window.confirm(
        "This will permanently delete your account. This action cannot be undone. Continue?"
      )
    ) {
      setMessage("Account deletion requires admin approval");
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Account" />
      <div className="settings-block">
        <label className="settings-label">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-dark"
        />
      </div>
      <div className="settings-block">
        <label className="settings-label">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 160))}
          rows={3}
          className="input-dark"
        />
      </div>
      <div className="settings-block">
        <label className="settings-label">Email</label>
        <p className="settings-static">{user?.email}</p>
      </div>
      <div className="settings-block">
        <label className="settings-label">Sign in method</label>
        <p className="settings-static capitalize">
          {user?.provider === "google" ? "Google" : "Email and password"}
        </p>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="btn-sapphire w-full mt-2"
      >
        {saving ? "Saving" : "Save changes"}
      </button>
      {message && <p className="settings-message">{message}</p>}

      <div className="settings-section-title">Danger zone</div>
      <button
        onClick={signOutAll}
        className="btn-outline-sapphire w-full justify-center mb-3"
      >
        Sign out from all devices
      </button>
      <button
        onClick={deleteAccount}
        className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition text-sm font-semibold"
      >
        Delete my account
      </button>
    </div>
  );
}