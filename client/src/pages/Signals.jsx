import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  X,
  Type,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import SignalViewer from "../components/SignalViewer";

const API = import.meta.env.VITE_API_URL;

export default function Signals() {
  const { user } = useAuth();
  const [signals, setSignals] = useState([]);
  const [composing, setComposing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState("");

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textInputRef = useRef(null);

  const load = () => {
    axios
      .get(`${API}/signals`)
      .then((r) => setSignals(r.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const openComposer = (kind) => {
    setMenuOpen(false);
    setText("");
    setImage(null);
    setPreview("");
    setComposing(true);
    setTimeout(() => {
      if (kind === "text") textInputRef.current?.focus();
      if (kind === "image") imageInputRef.current?.click();
      if (kind === "video") videoInputRef.current?.click();
    }, 100);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setPreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const closeComposer = () => {
    setComposing(false);
    setText("");
    clearImage();
  };

  const submit = async () => {
    if (!text.trim() && !image) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (image) formData.append("image", image);
      await axios.post(`${API}/signals`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      closeComposer();
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const performDelete = async (signalId) => {
    try {
      await axios.delete(`${API}/signals/${signalId}`);
      setViewing(null);
      setConfirmDelete(null);
      load();
      showToast("Signal deleted");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete");
    }
  };

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  return (
    <div className="signals-page">
      <header className="signals-header">
        <h1 className="signals-title">Signals</h1>
        <button
          onClick={() => setMenuOpen(true)}
          className="icon-btn-dark"
          aria-label="Add signal"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      <div className="signals-grid">
        <button onClick={() => setMenuOpen(true)} className="signal-add-card">
          <div className="signal-add-card-avatar">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="signal-add-card-avatar-img"
              />
            ) : (
              <div className="signal-add-card-avatar-fallback">
                {initial(user?.username)}
              </div>
            )}
            <span className="signal-add-card-plus">
              <Plus className="w-4 h-4 text-white" strokeWidth={3} />
            </span>
          </div>
          <p className="signal-add-card-label">Add signal</p>
        </button>

        {signals.map((s) => {
          const isMine =
            String(s.user?._id || "") === String(user?._id || "");
          return (
            <div
              key={s._id}
              className="signal-card relative"
              style={{ position: "relative" }}
            >
              <button
                onClick={() => setViewing(s)}
                className="signal-card"
                style={{ width: "100%" }}
              >
                <div className="signal-ring">
                  {s.user?.avatar ? (
                    <img
                      src={s.user.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="signal-avatar"
                    />
                  ) : (
                    <div className="signal-avatar-fallback">
                      {initial(s.user?.username)}
                    </div>
                  )}
                </div>
                <p className="signal-name">
                  {isMine ? "You" : s.user?.username?.split(" ")[0]}
                </p>
                <p className="signal-time">
                  {new Date(s.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>

              {isMine && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(s);
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{
                    backgroundColor: "#ef4444",
                    border: "2px solid #0b1220",
                    color: "#ffffff",
                    boxShadow: "0 4px 10px rgba(239,68,68,0.4)",
                  }}
                  aria-label="Delete signal"
                  title="Delete signal"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {signals.length === 0 && (
        <p className="text-xs text-blue-100/50 text-center px-6">
          No signals yet. Tap Add signal to share what you are up to.
        </p>
      )}

      {confirmDelete && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3 className="settings-modal-title">Delete signal?</h3>
              <button
                onClick={() => setConfirmDelete(null)}
                className="icon-btn-dark"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-blue-100/70">
                This will permanently remove your signal. It cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="btn-outline-sapphire flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => performDelete(confirmDelete._id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.30)",
                    color: "#fca5a5",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3 className="settings-modal-title">Add signal</h3>
              <button
                onClick={() => setMenuOpen(false)}
                className="icon-btn-dark"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="py-2">
              <button
                onClick={() => openComposer("text")}
                className="signal-option-row"
              >
                <div className="signal-option-icon">
                  <Type className="w-5 h-5" strokeWidth={1.9} />
                </div>
                <div className="flex-1 text-left">
                  <p className="signal-option-label">Add text</p>
                  <p className="signal-option-desc">Share what is happening</p>
                </div>
              </button>
              <button
                onClick={() => openComposer("image")}
                className="signal-option-row"
              >
                <div className="signal-option-icon">
                  <ImageIcon className="w-5 h-5" strokeWidth={1.9} />
                </div>
                <div className="flex-1 text-left">
                  <p className="signal-option-label">Add image</p>
                  <p className="signal-option-desc">
                    Pick a photo from your device
                  </p>
                </div>
              </button>
              <button
                onClick={() => openComposer("video")}
                className="signal-option-row"
              >
                <div className="signal-option-icon">
                  <Video className="w-5 h-5" strokeWidth={1.9} />
                </div>
                <div className="flex-1 text-left">
                  <p className="signal-option-label">Add video</p>
                  <p className="signal-option-desc">Choose a video file</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {composing && (
        <div className="settings-modal-backdrop" onClick={closeComposer}>
          <div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h3 className="settings-modal-title">New signal</h3>
              <button
                onClick={closeComposer}
                className="icon-btn-dark"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                ref={textInputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 280))}
                placeholder="What is happening?"
                rows={3}
                className="input-dark"
              />
              {preview ? (
                <div className="relative rounded-xl overflow-hidden">
                  {image?.type?.startsWith("video/") ? (
                    <video
                      src={preview}
                      controls
                      className="w-full max-h-64 object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt=""
                      className="w-full max-h-64 object-cover"
                    />
                  )}
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"
                    aria-label="Remove media"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="btn-outline-sapphire flex-1 justify-center"
                  >
                    <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
                    Image
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="btn-outline-sapphire flex-1 justify-center"
                  >
                    <Video className="w-4 h-4" strokeWidth={1.75} />
                    Video
                  </button>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleFile}
                className="hidden"
              />
              <button
                onClick={submit}
                disabled={uploading || (!text.trim() && !image)}
                className="btn-sapphire w-full"
              >
                {uploading ? "Sharing" : "Share signal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <SignalViewer
          signal={viewing}
          onClose={() => setViewing(null)}
          onDelete={performDelete}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-xl text-sm text-white"
          style={{
            backgroundColor: "rgba(15, 23, 46, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}