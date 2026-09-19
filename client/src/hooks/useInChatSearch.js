import { useEffect, useMemo, useState } from "react";

export const useInChatSearch = (messages, containerRef) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Bind Ctrl/Cmd+F
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => (m.text || "").toLowerCase().includes(q))
      .map((m) => m._id);
  }, [messages, query]);

  // Clamp currentIndex when matches change
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= matches.length) {
      setCurrentIndex(0);
    }
  }, [matches, currentIndex]);

  // Scroll to current match
  useEffect(() => {
    if (!open || matches.length === 0) return;
    const id = matches[currentIndex];
    const el = containerRef.current?.querySelector(`[data-message-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex, matches, open, containerRef]);

  const next = () => {
    if (matches.length === 0) return;
    setCurrentIndex((i) => (i + 1) % matches.length);
  };

  const prev = () => {
    if (matches.length === 0) return;
    setCurrentIndex((i) => (i - 1 + matches.length) % matches.length);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return {
    open,
    setOpen,
    query,
    setQuery,
    matches,
    currentIndex,
    highlightId: open && matches.length > 0 ? matches[currentIndex] : null,
    next,
    prev,
    close,
  };
};