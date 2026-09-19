import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import { RINGTONES } from "../lib/ringtones";
import { Play, Pause, Upload, Check, Loader2 } from "lucide-react";

export default function SettingsRingtone() {
  const { user, setRingtone, uploadRingtone } = useAuth();
  const [playing, setPlaying] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef(null);
  const fileRef = useRef(null);

  const current = user?.ringtone || "classic";

  const play = (ringtone) => {
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current = null;
    }
    if (playing === ringtone.id) {
      setPlaying(null);
      return;
    }
    const audio = new Audio(ringtone.src);
    previewRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlaying(null);
    setPlaying(ringtone.id);
  };

  const choose = async (ringtone) => {
    try {
      await setRingtone({ ringtone: ringtone.id, ringtoneUrl: "" });
    } catch {
      setError("Failed to save");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadRingtone(file);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Ringtone" />
      <p className="settings-hint">
        Choose the sound played when you receive a call.
      </p>

      {RINGTONES.map((r) => {
        const isSelected = current === r.id;
        const isPlaying = playing === r.id;
        return (
          <div key={r.id} className="settings-row-static">
            <button
              onClick={() => play(r)}
              className="icon-btn-dark"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Play className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
            <p className="flex-1 settings-row-label">{r.label}</p>
            {isSelected && (
              <Check className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
            )}
            {!isSelected && (
              <button
                onClick={() => choose(r)}
                className="text-sm text-blue-400 font-medium"
              >
                Use
              </button>
            )}
          </div>
        );
      })}

      <div className="settings-section-title">Custom ringtone</div>
      <div className="settings-block">
        {current === "custom" && user?.ringtoneUrl && (
          <audio controls src={user.ringtoneUrl} className="w-full mb-3" />
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-outline-sapphire w-full justify-center"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" strokeWidth={1.75} />
          )}
          {uploading ? "Uploading…" : "Upload audio file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          onChange={handleUpload}
          className="hidden"
        />
        {error && (
          <p className="text-sm text-red-400 mt-3 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}