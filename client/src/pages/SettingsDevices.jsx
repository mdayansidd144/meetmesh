import { useEffect, useState } from "react";
import axios from "axios";
import SettingsHeader from "../components/SettingsHeader";

const API = import.meta.env.VITE_API_URL;

export default function SettingsDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios
      .get(`${API}/devices`)
      .then((r) => setDevices(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const ua = navigator.userAgent;
    const name = ua.includes("Windows")
      ? "Windows"
      : ua.includes("Mac")
      ? "Mac"
      : ua.includes("Android")
      ? "Android"
      : ua.includes("iPhone")
      ? "iPhone"
      : "Web browser";
    axios.post(`${API}/devices/register`, { deviceName: name }).finally(load);
  }, []);

  const revoke = async (id) => {
    if (!window.confirm("Revoke this device?")) return;
    await axios.delete(`${API}/devices/${id}`);
    load();
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Linked devices" />
      <p className="settings-hint">
        These are devices signed in to your account. Revoking removes access.
      </p>
      {loading ? (
        <p className="settings-empty">Loading</p>
      ) : devices.length === 0 ? (
        <p className="settings-empty">No linked devices</p>
      ) : (
        devices.map((d) => (
          <div key={d._id} className="settings-row-static">
            <div className="flex-1 min-w-0">
              <p className="settings-row-label truncate">{d.deviceName}</p>
              <p className="settings-row-description truncate">
                Last active {new Date(d.lastActive).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => revoke(d._id)}
              className="text-sm text-red-400 font-medium"
            >
              Revoke
            </button>
          </div>
        ))
      )}
    </div>
  );
}