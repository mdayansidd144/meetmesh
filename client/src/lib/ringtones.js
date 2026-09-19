export const RINGTONES = [
  // ── Classic ─────────────────────────────────────
  { id: "classic",    label: "Classic",     src: "https://cdn.pixabay.com/audio/2025/11/16/audio_a8d8fa395c.mp3", category: "Classic", category: "Classic" },
  { id: "chime",      label: "Chime",       src: "/ringtones/chime.mp3", category: "Classic" },
  { id: "pulse",      label: "Pulse",       src: "/ringtones/pulse.mp3", category: "Classic" },
  { id: "retro",      label: "Retro",       src: "/ringtones/retro.mp3", category: "Classic" },
  { id: "bells",      label: "Bells",       src: "/ringtones/wind.mp3", category: "Classic" },
  { id: "marimba",    label: "Marimba",     src: "/ringtones/marimba.mp3", category: "Classic" },
  { id: "qubool-mazaar", label: "Qubool Hai (First Look)", src: "/ringtones/qubool hai 1.mp3", category: "Filmi" },
  { id: "qubool-toy",    label: "Qubool Hai (Toy)",    src: "/ringtones/qubool hai 2.mp3",    category: "Filmi" },
   { id: "qubool-hai",    label: "Qubool Hai (fight)",    src: "/ringtones/qubool hai 3.mp3",    category: "Filmi" },
  { id: "tujh bin",    label: "tujh bin 1",     src: "/ringtones/tujh bin 2.mp3", category: "Alerts" },
  { id: "tujh bin instrument",    label: "tujh bin 2",     src: "/ringtones/tujh bin tune.mp3", category: "Alerts" },
  { id: "hasi ban gaye",    label: "hasi ban gaye",     src: "/ringtones/hasi ban gaye.mp3", category: "Alerts" },
  { id: "savannah",    label: "savannah",     src: "/ringtones/savannah.mp3", category: "Alerts" },
  { id: "rockabye",    label: "rockabye",     src: "/ringtones/rockabye.mp3", category: "Alerts" },
  { id: "tropic love",    label: "tropic love",     src: "/ringtones/tropic love.mp3", category: "Alerts" },
  { id: "kabhi kabhi aditi",   label: "kabhi kabhi aditi",   src: "/ringtones/kabhi kabhi aditi.mp3", category: "Nature" },
  { id: "snowman",   label: "snowman",    src: "/ringtones/snowman.mp3", category: "Nature" },
  { id: "tune jo na kaha",   label: "tune jo na kaha",       src: "/ringtones/tune jo na kaha.mp3", category: "Nature" },
  { id: "ye dooriyan",   label: "ye dooriyan",        src: "/ringtones/ye dooriyan.mp3", category: "Nature" },
  { id: "tu jahaan",   label: "tu jahaan",    src: "/ringtones/tu jahaan.mp3", category: "Nature" },
  { id: "ishq risk",   label: "ishq risk",      src: "/ringtones/ishq risk.mp3", category: "Nature"},]

export const getRingtoneSrc = (ringtone, ringtoneUrl) => {
  if (ringtone === "custom" && ringtoneUrl) return ringtoneUrl;
  const found = RINGTONES.find((r) => r.id === ringtone);
  return found ? found.src : RINGTONES[0].src;
};