import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Mail,
  User as UserIcon,
  Calendar,
  Shield,
  Camera,
  Smile,
  Loader2,
} from "lucide-react";

export default function Profile() {
  const { user, updateProfile, uploadAvatar, generateEmojiAvatar, logout } =
    useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile(form);
      setMessage("Profile updated");
      setEditing(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      await uploadAvatar(file);
      setMessage("Profile picture updated");
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateEmoji = async () => {
    setGenerating(true);
    setMessage("");
    try {
      await generateEmojiAvatar();
      setMessage("Emoji avatar generated");
    } catch (err) {
      setMessage(err.response?.data?.message || "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-6 relative">
      <div className="bg-canvas" />
      <div className="max-w-2xl mx-auto card-light overflow-hidden fade-up">
        <div className="px-6 py-5 divider-light flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="icon-btn-light"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <h1 className="text-lg font-extrabold brand-sapphire-inverse">
            Your profile
          </h1>
          <div className="flex-1" />
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="btn-outline-sapphire"
          >
            Sign out
          </button>
        </div>
        <div className="px-6 py-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full avatar-sapphire text-4xl">
                  {initial(user?.username)}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {user?.username}
            </h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.bio && (
              <p className="text-sm text-slate-600 mt-3 max-w-md text-center">
                {user.bio}
              </p>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-outline-sapphire"
              >
                <Camera className="w-4 h-4" strokeWidth={1.75} />
                Upload photo
              </button>
              <button
                onClick={handleGenerateEmoji}
                disabled={generating}
                className="btn-outline-sapphire"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Smile className="w-4 h-4" strokeWidth={1.75} />
                )}
                Generate emoji
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Mail className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                Email
              </p>
              <p className="text-sm text-slate-900">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Shield className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                Sign in method
              </p>
              <p className="text-sm text-slate-900 capitalize">
                {user?.provider === "google" ? "Google" : "Email and password"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                Joined
              </p>
              <p className="text-sm text-slate-900">{joinedDate}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 divider-light">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-sapphire w-full"
            >
              Edit profile
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <UserIcon
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                  strokeWidth={1.75}
                />
                <input
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="input-light pl-11"
                />
              </div>
              <textarea
                placeholder="Short bio, up to 160 characters"
                value={form.bio}
                onChange={(e) =>
                  setForm({ ...form, bio: e.target.value.slice(0, 160) })
                }
                rows={3}
                className="input-light"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-sapphire flex-1"
                >
                  {saving ? "Saving" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      username: user?.username || "",
                      bio: user?.bio || "",
                    });
                  }}
                  className="btn-outline-sapphire flex-1 justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {message && (
            <p className="text-sm text-center mt-4 text-slate-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}