import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, X, Check } from "lucide-react";
import SettingsHeader from "../components/SettingsHeader";

const API = import.meta.env.VITE_API_URL;

export default function SettingsLists() {
  const [lists, setLists] = useState([]);
  const [users, setUsers] = useState([]);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);

  const load = () => {
    Promise.all([axios.get(`${API}/lists`), axios.get(`${API}/auth/users`)])
      .then(([lRes, uRes]) => {
        setLists(lRes.data);
        setUsers(uRes.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSelected([]);
    setComposing(true);
  };

  const openEdit = (list) => {
    setEditing(list);
    setName(list.name);
    setSelected(list.members.map((m) => m._id));
    setComposing(true);
  };

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await axios.put(`${API}/lists/${editing._id}`, {
          name,
          memberIds: selected,
        });
      } else {
        await axios.post(`${API}/lists`, { name, memberIds: selected });
      }
      setComposing(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this list?")) return;
    await axios.delete(`${API}/lists/${id}`);
    load();
  };

  const initial = (n) => n?.[0]?.toUpperCase() || "?";

  return (
    <div className="settings-page">
      <SettingsHeader title="Lists" />
      <p className="settings-hint">
        Organize your contacts into lists for quick filtering.
      </p>
      <div className="flex justify-end px-5 pb-3">
        <button onClick={openCreate} className="btn-sapphire">
          <Plus className="w-4 h-4 mr-1 inline" strokeWidth={2} />
          New list
        </button>
      </div>
      {lists.length === 0 ? (
        <p className="settings-empty">No lists yet</p>
      ) : (
        lists.map((l) => (
          <div key={l._id} className="settings-row-static">
            <div className="flex-1 min-w-0">
              <p className="settings-row-label">{l.name}</p>
              <p className="settings-row-description">
                {l.members.length} members
              </p>
            </div>
            <button
              onClick={() => openEdit(l)}
              className="text-sm text-blue-400 font-medium mr-3"
            >
              Edit
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

      {composing && (
        <div className="settings-modal-backdrop" onClick={() => setComposing(false)}>
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3 className="settings-modal-title">
                {editing ? "Edit list" : "New list"}
              </h3>
              <button
                onClick={() => setComposing(false)}
                className="icon-btn-dark"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="List name"
                className="input-dark"
              />
              <p className="settings-label">Members</p>
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
              <button onClick={save} className="btn-sapphire w-full">
                {editing ? "Save changes" : "Create list"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}