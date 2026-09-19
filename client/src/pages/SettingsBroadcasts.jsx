import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";

export default function SettingsBroadcasts() {
  const { user, patchSettings } = useAuth();
  const [value, setValue] = useState(
    user?.settings?.broadcasts?.whoCanAdd || "contacts"
  );

  useEffect(() => {
    setValue(user?.settings?.broadcasts?.whoCanAdd || "contacts");
  }, [user]);

  const update = async (v) => {
    setValue(v);
    try {
      await patchSettings("broadcasts", { whoCanAdd: v });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Broadcasts" />
      <p className="settings-hint">
        Control who can add you to their broadcast lists.
      </p>
      <div className="settings-block">
        <select
          value={value}
          onChange={(e) => update(e.target.value)}
          className="input-dark"
        >
          <option value="everyone" className="bg-[#0f172e]">
            Everyone
          </option>
          <option value="contacts" className="bg-[#0f172e]">
            My contacts
          </option>
          <option value="nobody" className="bg-[#0f172e]">
            Nobody
          </option>
        </select>
      </div>
    </div>
  );
}