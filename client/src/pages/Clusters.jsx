import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import CreateRoomModal from "../components/CreateRoomModal";

const API = import.meta.env.VITE_API_URL;

export default function Clusters() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    Promise.all([axios.get(`${API}/rooms`), axios.get(`${API}/auth/users`)])
      .then(([rRes, uRes]) => {
        setRooms(rRes.data);
        setUsers(uRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (name, memberIds) => {
    const { data } = await axios.post(`${API}/rooms`, { name, memberIds });
    setRooms((prev) => [data, ...prev]);
    setShowCreate(false);
  };

  const openCluster = (room) => {
    navigate("/", { state: { openRoomId: room._id } });
  };

  return (
    <div className="clusters-page">
      <header className="signals-header">
        <h1 className="signals-title">Clusters</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="icon-btn-dark"
          aria-label="New cluster"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>
      {loading ? (
        <p className="text-center text-blue-100/60 text-sm py-8">Loading</p>
      ) : rooms.length === 0 ? (
        <div className="signals-empty">
          <p className="text-sm text-blue-100/60 text-center">
            No clusters yet. Tap + to start one.
          </p>
        </div>
      ) : (
        <div className="clusters-list">
          {rooms.map((r) => (
            <button
              key={r._id}
              onClick={() => openCluster(r)}
              className="cluster-row"
            >
              <div className="w-12 h-12 rounded-2xl avatar-sapphire flex-shrink-0">
                <Users className="w-6 h-6" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {r.name}
                </p>
                <p className="text-xs text-blue-100/60 truncate mt-0.5">
                  {r.members.length} members
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {showCreate && (
        <CreateRoomModal
          users={users}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}