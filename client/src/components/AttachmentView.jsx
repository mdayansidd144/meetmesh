import { Download, FileText, Play, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";
export default function AttachmentView({ attachment, mine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const update = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
    });
    return () => {
      audio.removeEventListener("timeupdate", update);
    };
  }, []);

  if (!attachment) return null;
  const { url, name, size, kind, duration } = attachment;
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDuration = (sec) => {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (kind === "image") {
    return (
      <div className="mb-2">
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={name || "Attachment"}
            className="max-w-full rounded-lg max-h-64 object-cover cursor-zoom-in"
            loading="lazy"
          />
        </a>
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div
        className={`mb-2 flex items-center gap-3 p-2 rounded-lg ${
          mine ? "bg-white/15" : "bg-slate-100"
        }`}
      >
        <button
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            mine ? "bg-white text-blue-600" : "bg-blue-500 text-white"
          }`}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="w-4 h-4" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="w-4 h-4 ml-0.5" fill="currentColor" strokeWidth={0} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div
            className={`h-1 rounded-full overflow-hidden ${
              mine ? "bg-white/25" : "bg-slate-300"
            }`}
          >
            <div
              className={`h-full ${
                mine ? "bg-white" : "bg-blue-500"
              } transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p
            className={`text-[10px] mt-1 ${
              mine ? "text-white/75" : "text-slate-500"
            }`}
          >
            {formatDuration(duration) || "Voice note"}
          </p>
        </div>
        <audio ref={audioRef} src={url} preload="metadata" />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mb-2 flex items-center gap-3 p-3 rounded-lg transition ${
        mine
          ? "bg-white/15 hover:bg-white/25"
          : "bg-slate-100 hover:bg-slate-200"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          mine ? "bg-white text-blue-600" : "bg-blue-500 text-white"
        }`}
      >
        <FileText className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            mine ? "text-white" : "text-slate-900"
          }`}
        >
          {name || "File"}
        </p>
        <p
          className={`text-[11px] ${
            mine ? "text-white/70" : "text-slate-500"
          }`}
        >
          {formatSize(size)}
        </p>
      </div>
      <Download
        className={`w-4 h-4 flex-shrink-0 ${
          mine ? "text-white/75" : "text-slate-500"
        }`}
        strokeWidth={2}
      />
    </a>
  );
}