import { WifiOff } from "lucide-react";
export default function ConnectionBadge({ connected }) {
  if (connected) return null;
  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg flex items-center gap-2"
      style={{ backgroundColor: "rgba(239, 68, 68, 0.92)" }}
    >
      <WifiOff className="w-3.5 h-3.5" />
      Reconnecting…
    </div>
  );
}