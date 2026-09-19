import { useEffect, useState } from "react";
import axios from "axios";
import SettingsHeader from "../components/SettingsHeader";

const API = import.meta.env.VITE_API_URL;

export default function SettingsStorage() {
  const [stats, setStats] = useState({ total: 0, byKind: {}, count: 0 });
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/settings/storage`)
      .then((r) => setStats(r.data))
      .catch((err) => console.error(err));
  }, []);

  const fmt = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(1)} ${units[i]}`;
  };

  const clearCache = () => {
    try {
      localStorage.removeItem("mediaCache");
      localStorage.removeItem("chatCache");
      setCleared(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Storage and data" />
      <div className="settings-block">
        <p className="settings-label">Total media uploaded</p>
        <p className="settings-static">{fmt(stats.total)}</p>
      </div>
      <div className="settings-block">
        <p className="settings-label">Images</p>
        <p className="settings-static">{fmt(stats.byKind?.image || 0)}</p>
      </div>
      <div className="settings-block">
        <p className="settings-label">Audio</p>
        <p className="settings-static">{fmt(stats.byKind?.audio || 0)}</p>
      </div>
      <div className="settings-block">
        <p className="settings-label">Other files</p>
        <p className="settings-static">{fmt(stats.byKind?.file || 0)}</p>
      </div>
      <div className="settings-block">
        <p className="settings-label">Total attachments</p>
        <p className="settings-static">{stats.count}</p>
      </div>
      <button
        onClick={clearCache}
        className="btn-outline-sapphire w-full justify-center mt-2"
      >
        Clear local cache
      </button>
      {cleared && <p className="settings-message">Local cache cleared</p>}
    </div>
  );
}