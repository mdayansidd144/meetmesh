import { cn, colorForUsername } from "@/lib/utils";
export default function SearchResults({
  loading,
  results,
  query,
  currentUserId,
  users,
  onSelect,
}) {
  if (query.trim().length < 2) return null;

  if (loading) {
    return (
      <div className="px-4 py-3 text-xs text-blue-100/60">Searching…</div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-blue-100/60">
        No messages match "{query}"
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-1">
      <p className="pill-label-dark px-2 py-1">Messages · {results.length}</p>
      {results.map((r) => {
        const isMine = r.sender?._id === currentUserId;
        const senderName = isMine ? "You" : r.sender?.username || "User";

        const dmPeer = !r.isRoom
          ? users?.find((u) => u._id === r.peer?._id)
          : null;

        const target = r.isRoom
          ? r.room?.name
          : dmPeer?.username || "Direct message";

        const targetColor = r.isRoom
          ? "#93c5fd"
          : colorForUsername(dmPeer?.username || "?");

        return (
          <button
            key={r._id}
            onClick={() => onSelect(r)}
            className={cn("contact-row", "w-full", "text-left")}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: targetColor }}
                >
                  {target}
                </span>
                <span className="text-[10px] text-blue-100/50 flex-shrink-0">
                  {new Date(r.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/70 truncate mt-0.5">
                <span className="text-blue-200/90 font-medium">
                  {senderName}:
                </span>{" "}
                {r.text}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}