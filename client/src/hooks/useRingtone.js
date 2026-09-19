import { useEffect, useRef } from "react";
import { getRingtoneSrc } from "../lib/ringtones";

export const useRingtone = (ringtoneId, ringtoneUrl, active) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      return;
    }

    const src = getRingtoneSrc(ringtoneId, ringtoneUrl);
    if (!src) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.85;
    audioRef.current = audio;

    audio.play().catch((err) => {
      console.warn("Ringtone autoplay blocked:", err.message);
    });

    if (navigator.vibrate) {
      try {
        navigator.vibrate([300, 200, 300, 200]);
      } catch {}
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
      if (navigator.vibrate) {
        try {
          navigator.vibrate(0);
        } catch {}
      }
    };
  }, [ringtoneId, ringtoneUrl, active]);

  return audioRef;
};