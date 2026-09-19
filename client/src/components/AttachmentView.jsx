import { Download, FileText, Play, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AttachmentView({ attachment, mine }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [peaks, setPeaks] = useState(null);

  // ── Load waveform peaks (only for audio) ──
  useEffect(() => {
    if (!attachment || attachment.kind !== "audio") return;
    let cancelled = false;

    const loadWaveform = async () => {
      try {
        const res = await fetch(attachment.url);
        const arrayBuffer = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const samples = 60;
        const blockSize = Math.floor(channelData.length / samples);
        const out = [];
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
          }
          out.push(sum / blockSize);
        }
        const max = Math.max(...out, 0.001);
        const normalized = out.map((v) => v / max);
        if (!cancelled) setPeaks(normalized);
        ctx.close();
      } catch (err) {
        // fallback to fake flat waveform
        if (!cancelled) setPeaks(Array.from({ length: 60 }, () => 0.3));
      }
    };

    loadWaveform();
    return () => {
      cancelled = true;
    };
  }, [attachment?.url, attachment?.kind]);

  // ── Draw waveform on canvas ──
  useEffect(() => {
    if (!canvasRef.current || !peaks) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const barWidth = 2;
    const gap = 1;
    const totalBars = peaks.length;
    const totalWidth = totalBars * (barWidth + gap) - gap;
    const offsetX = (cssWidth - totalWidth) / 2;
    const midY = cssHeight / 2;

    peaks.forEach((v, i) => {
      const barHeight = Math.max(2, v * cssHeight * 0.85);
      const x = offsetX + i * (barWidth + gap);
      const played = i / totalBars <= progress / 100;
      ctx.fillStyle = mine
        ? played
          ? "#ffffff"
          : "rgba(255,255,255,0.45)"
        : played
          ? "#3b82f6"
          : "rgba(148,163,184,0.55)";
      ctx.fillRect(x, midY - barHeight / 2, barWidth, barHeight);
    });
  }, [peaks, progress, mine]);

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
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const seekFromClick = (e) => {
    if (!audioRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    if (audioRef.current.duration) {
      audioRef.current.currentTime = ratio * audioRef.current.duration;
    }
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
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            mine ? "bg-white text-blue-600" : "bg-blue-500 text-white"
          }`}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="w-4 h-4" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play
              className="w-4 h-4 ml-0.5"
              fill="currentColor"
              strokeWidth={0}
            />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <canvas
            ref={canvasRef}
            onClick={seekFromClick}
            className="w-full h-8 cursor-pointer"
            style={{ display: "block" }}
          />
          <div
            className={`flex justify-between text-[10px] mt-1 ${
              mine ? "text-white/75" : "text-slate-500"
            }`}
          >
            <span>
              {formatDuration(
                audioRef.current
                  ? Math.floor(audioRef.current.currentTime)
                  : 0,
              )}
            </span>
            <span>{formatDuration(duration) || "Voice note"}</span>
          </div>
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