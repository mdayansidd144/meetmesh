import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, X, Check, Users, Send } from "lucide-react";
import SettingsHeader from "../components/SettingsHeader";

const API = import.meta.env.VITE_API_URL;

export default function Broadcasts() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [users, setUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(null);
  const [text, setText] = useState("");

  const load = () => {
    Promise.all([
      axios.get(`${API}/broadcasts`),
      axios.get(`${API}/auth/users`),
    ])
      .then(([bRes, uRes]) => {
        setLists(bRes.data);
        setUsers(uRes.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!name.trim() || selected.length === 0) return;
    await axios.post(`${API}/broadcasts`, {
      name,
      recipientIds: selected,
    });
    setName("");
    setSelected([]);
    setCreating(false);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this list?")) return;
    await axios.delete(`${API}/broadcasts/${id}`);
    load();
  };

  const send = async (id) => {
    if (!text.trim()) return;
    await axios.post(`${API}/broadcasts/${id}/send`, { text });
    setText("");
    setSending(null);
  };

  const initial = (n) => n?.[0]?.toUpperCase() || "?";

  return (
    <div className="settings-page">
      <SettingsHeader title="Broadcast lists" />
      <p className="settings-hint">
        Send one message to many recipients at once.
      </p>
      <div className="flex justify-end px-5 pb-3">
        <button onClick={() => setCreating(true)} className="btn-sapphire">
          <Plus className="w-4 h-4 mr-1 inline" strokeWidth={2} />
          New list
        </button>
      </div>
      {lists.length === 0 ? (
        <p className="settings-empty">No broadcast lists yet</p>
      ) : (
        lists.map((l) => (
          <div key={l._id} className="settings-row-static">
            <div className="w-10 h-10 rounded-2xl avatar-sapphire flex-shrink-0">
              <Users className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="settings-row-label">{l.name}</p>
              <p className="settings-row-description">
                {l.recipients.length} recipients
              </p>
            </div>
            <button
              onClick={() => setSending(l._id)}
              className="text-sm text-blue-400 font-medium mr-3"
            >
              Send
            </button>
            <button
              onClick={() => remove(l._id)}
              className="text-sm text-red-400 font-medium"
            >
              Delete
            </button>
          </div>
        ))
      )}

      {creating && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setCreating(false)}
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3 className="settings-modal-title">New broadcast list</h3>
              <button
                onClick={() => setCreating(false)}
                className="icon-btn-dark"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                placeholder="List name"
                className="input-dark"
              />
              {users.map((u) => {
                const on = selected.includes(u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => toggle(u._id)}
                    className="w-full flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-white/5 transition"
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full avatar-sapphire text-xs">
                        {initial(u.username)}
                      </div>
                    )}
                    <p className="flex-1 text-left text-sm text-white truncate">
                      {u.username}
                    </p>
                    {on && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
              <button
                onClick={save}
                disabled={!name.trim() || selected.length === 0}
                className="btn-sapphire w-full"
              >
                Create list
              </button>
            </div>
          </div>
        </div>
      )}

      {sending && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setSending(null)}
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3 className="settings-modal-title">Send broadcast</h3>
              <button
                onClick={() => setSending(null)}
                className="icon-btn-dark"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Write your message"
                className="input-dark"
              />
              <button
                onClick={() => send(sending)}
                className="btn-sapphire w-full flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" strokeWidth={2} />
                Send to all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}