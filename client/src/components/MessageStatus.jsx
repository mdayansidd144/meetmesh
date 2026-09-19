import { Check, CheckCheck, Loader2 } from "lucide-react";

const GREY = "rgba(255, 255, 255, 0.75)";
const GREEN = "#22c55e";

export default function MessageStatus({ status }) {
  if (status === "sending") {
    return (
      <Loader2
        className="w-3 h-3 animate-spin"
        strokeWidth={2.5}
        style={{ color: GREY }}
      />
    );
  }
  if (status === "sent") {
    return (
      <Check
        className="w-3.5 h-3.5"
        strokeWidth={2.5}
        style={{ color: GREY }}
      />
    );
  }
  if (status === "delivered") {
    return (
      <CheckCheck
        className="w-3.5 h-3.5"
        strokeWidth={2.5}
        style={{ color: GREY }}
      />
    );
  }
  if (status === "read") {
    return (
      <CheckCheck
        className="w-3.5 h-3.5"
        strokeWidth={3}
        style={{
          color: GREEN,
          filter: "drop-shadow(0 0 3px rgba(34, 197, 94, 0.55))",
        }}
      />
    );
  }
  return null;
}