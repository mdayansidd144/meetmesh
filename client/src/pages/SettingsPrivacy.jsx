import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import SettingsToggle from "../components/SettingsToggle";

const API = import.meta.env.VITE_API_URL;

export default function SettingsPrivacy() {
  const { user, patchSettings, refreshUser } = useAuth();
  const [privacy, setPrivacy] = useState(user?.settings?.privacy || {});
  const [blocked, setBlocked] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/auth/users`)
      .then((r) => setUsers(r.data))
      .catch((err) => console.error(err));
    refreshUser().then((data) => {
      setPrivacy(data.settings?.privacy || {});
      setBlocked(data.blockedUsers || []);
    });
  }, []);

  const update = async (key, value) => {
    const next = { ...privacy, [key]: value };
    setPrivacy(next);
    setSaving(true);
    try {
      await patchSettings("privacy", next);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const blockUser = async (id) => {
    const { data } = await axios.post(`${API}/settings/block/${id}`);
    setBlocked(data.blockedUsers);
  };

  const unblockUser = async (id) => {
    const { data } = await axios.delete(`${API}/settings/block/${id}`);
    setBlocked(data.blockedUsers);
  };

  const Select = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-dark"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#0f172e]">
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </option>
      ))}
    </select>
  );

  const initial = (name) => name?.[0]?.toUpperCase() || "?";
  const blockedIds = blocked.map((b) => b._id);

  return (
    <div className="settings-page">
      <SettingsHeader title="Privacy" />

      <div className="settings-block">
        <label className="settings-label">Last seen</label>
        <Select
          value={privacy.lastSeen || "everyone"}
          onChange={(v) => update("lastSeen", v)}
          options={["everyone", "contacts", "nobody"]}
        />
      </div>
      <div className="settings-block">
        <label className="settings-label">Profile photo</label>
        <Select
          value={privacy.profilePhoto || "everyone"}
          onChange={(v) => update("profilePhoto", v)}
          options={["everyone", "contacts", "nobody"]}
        />
      </div>
      <div className="settings-block">
        <label className="settings-label">About</label>
        <Select
          value={privacy.about || "everyone"}
          onChange={(v) => update("about", v)}
          options={["everyone", "contacts", "nobody"]}
        />
      </div>
      <div className="settings-block">
        <label className="settings-label">Status</label>
        <Select
          value={privacy.status || "everyone"}
          onChange={(v) => update("status", v)}
          options={["everyone", "contacts", "nobody"]}
        />
      </div>

      <div className="settings-row-static">
        <div className="flex-1">
          <p className="settings-row-label">Read receipts</p>
          <p className="settings-row-description">
            Send and receive blue ticks on messages
          </p>
        </div>
        <SettingsToggle
          checked={privacy.readReceipts !== false}
          onChange={(v) => update("readReceipts", v)}
        />
      </div>

      <div className="settings-section-title">Blocked users</div>
      {blocked.length === 0 ? (
        <p className="settings-empty">No blocked users</p>
      ) : (
        blocked.map((u) => (
          <div key={u._id} className="settings-row-static">
            {u.avatar ? (
              <img
                src={u.avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full avatar-sapphire text-sm">
                {initial(u.username)}
              </div>
            )}
            <p className="flex-1 settings-row-label truncate">{u.username}</p>
            <button
              onClick={() => unblockUser(u._id)}
              className="text-sm text-blue-400 font-medium"
            >
              Unblock
            </button>
          </div>
        ))
      )}

      <div className="settings-section-title">Block a user</div>
      <div className="settings-block">
        <select
          className="input-dark"
          defaultValue=""
          onChange={(e) => e.target.value && blockUser(e.target.value)}
        >
          <option value="" className="bg-[#0f172e]">
            Select a user
          </option>
          {users
            .filter((u) => !blockedIds.includes(u._id))
            .map((u) => (
              <option key={u._id} value={u._id} className="bg-[#0f172e]">
                {u.username}
              </option>
            ))}
        </select>
      </div>

      {saving && <p className="settings-message">Saving</p>}
    </div>
  );
}