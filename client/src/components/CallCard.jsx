import { Phone, PhoneOutgoing, PhoneIncoming, Video, PhoneMissed } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CallCard({ message, mine }) {
  const isVideo = message.type === "call_video";
  const status = message.callMeta?.status || "missed";
  const duration = message.callMeta?.duration || 0;
  const isMissed = status === "missed" || status === "declined";

  const Icon = isMissed
    ? PhoneMissed
    : mine
    ? PhoneOutgoing
    : PhoneIncoming;

  const label = (() => {
    if (status === "missed") {
      return isVideo ? "Missed video call" : "Missed voice call";
    }
    if (status === "declined") {
      return isVideo ? "Declined video call" : "Declined voice call";
    }
    if (status === "cancelled") {
      return isVideo ? "Cancelled video call" : "Cancelled voice call";
    }
    return isVideo ? "Video call" : "Voice call";
  })();

  const formattedDuration = (() => {
    if (!duration || duration === 0) return "";
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  })();

  return (
    <div
      className={cn(
        "max-w-[80%] md:max-w-[65%] px-4 py-3 text-sm weave-in flex items-center gap-3",
        mine ? "call-card-out" : "call-card-in",
        !mine && isMissed && "missed"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          mine
            ? "bg-white/15 text-white"
            : isMissed
            ? "bg-red-50 text-red-500"
            : "bg-blue-50 text-blue-500"
        )}
      >
        <Icon className="w-4 h-4 call-icon" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-tight">{label}</p>
        {formattedDuration && (
          <p
            className={cn(
              "text-[11px] mt-0.5",
              mine ? "text-white/70" : "text-slate-500"
            )}
          >
            {formattedDuration}
          </p>
        )}
        <p
          className={cn(
            "text-[10px] mt-0.5",
            mine ? "text-white/60" : "text-slate-400"
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}