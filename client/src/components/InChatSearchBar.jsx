import { useEffect, useRef } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

export default function InChatSearchBar({
  query,
  onQueryChange,
  matchCount,
  currentIndex,
  onNext,
  onPrev,
  onClose,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") {
      if (e.shiftKey) onPrev();
      else onNext();
    }
  };

  return (
    <div className="px-4 py-2 chat-header-tint flex items-center gap-3 border-b border-blue-200/40">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in conversation…"
        className="flex-1 px-3 py-1.5 rounded-lg bg-white/70 border border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-500"
      />
      <span className="text-xs text-slate-500 whitespace-nowrap">
        {matchCount === 0
          ? "No matches"
          : `${currentIndex + 1} of ${matchCount}`}
      </span>
      <button
        onClick={onPrev}
        disabled={matchCount === 0}
        className="icon-btn-light"
        aria-label="Previous match"
      >
        <ChevronUp className="w-4 h-4" strokeWidth={2} />
      </button>
      <button
        onClick={onNext}
        disabled={matchCount === 0}
        className="icon-btn-light"
        aria-label="Next match"
      >
        <ChevronDown className="w-4 h-4" strokeWidth={2} />
      </button>
      <button
        onClick={onClose}
        className="icon-btn-light"
        aria-label="Close search"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}