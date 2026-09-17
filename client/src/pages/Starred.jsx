import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import SettingsHeader from "../components/SettingsHeader";

const API = import.meta.env.VITE_API_URL;

export default function Starred() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios
      .get(`${API}/settings/starred`)
      .then((r) => setMessages(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const unstar = async (id) => {
    await axios.put(`${API}/settings/star/${id}`, { starred: false });
    load();
  };

  const openSource = (m) => {
    if (m.room) {
      navigate("/", { state: { openRoomId: m.room } });
    } else {
      const other = m.sender?._id;
      navigate("/", { state: { openContactId: other } });
    }
  };

  const initial = (n) => n?.[0]?.toUpperCase() || "?";

  return (
    <div className="settings-page">
      <SettingsHeader title="Starred messages" />
      {loading ? (
        <p className="settings-empty">Loading</p>
      ) : messages.length === 0 ? (
        <p className="settings-empty">No starred messages</p>
      ) : (
        messages.map((m) => (
          <div key={m._id} className="settings-row-static">
            {m.sender?.avatar ? (
              <img
                src={m.sender.avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full avatar-sapphire text-sm">
                {initial(m.sender?.username)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="settings-row-label truncate">
                {m.sender?.username || "User"}
              </p>
              <p className="settings-row-description truncate">
                {m.text || "Attachment"}
              </p>
            </div>
            <button
              onClick={() => openSource(m)}
              className="text-sm text-blue-400 font-medium mr-3"
            >
              Open
            </button>
            <button
              onClick={() => unstar(m._id)}
              className="text-amber-400"
              aria-label="Unstar"
            >
              <Star className="w-4 h-4" fill="currentColor" strokeWidth={0} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}