import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  X,
  UserPlus,
  CheckCircle2,
  Clock,
  AtSign,
  Search,
  Check,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

const API = import.meta.env.VITE_API_URL;

export default function NewChatModal({ onClose, onRequestSent }) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [requestingId, setRequestingId] = useState(null);

  const debounced = useDebounce(input, 250);
  const looksLikeEmail = input.includes("@");
  const requestRef = useRef(null);

  useEffect(() => {
    requestRef.current?.abort?.();
    const controller = new AbortController();
    requestRef.current = controller;

    const q = debounced.trim();

    // Same guard as the backend — don't search bare "@" or too-short strings
    let shouldSearch = false;
    if (q.includes("@")) {
      const [before, after = ""] = q.split("@");
      shouldSearch = before.length >= 2 || after.length >= 2;
    } else {
      shouldSearch = q.length >= 2;
    }

    if (!shouldSearch) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    axios
      .get(`${API}/contacts/search`, {
        params: { q },
        signal: controller.signal,
      })
      .then((r) => setResults(r.data.results || []))
      .catch((err) => {
        if (err.name !== "CanceledError") setResults([]);
      })
      .finally(() => setSearching(false));

    return () => controller.abort();
  }, [debounced]);

  const sendRequest = async (identifier) => {
    setStatus("loading");
    setMessage("");
    try {
      const { data } = await axios.post(`${API}/contacts/request`, {
        identifier,
      });
      setStatus("success");
      setMessage(`Request sent to ${data.foundUser?.username || identifier}`);
      onRequestSent?.(data);

      setResults((prev) =>
        prev.map((u) =>
          u.username === data.foundUser?.username
            ? { ...u, status: "outgoing-pending" }
            : u
        )
      );
    } catch (err) {
      const code = err.response?.status;
      const data = err.response?.data;
      if (code === 404) {
        setStatus("error");
        setMessage(
          looksLikeEmail
            ? "No user found with that email"
            : "No user found with that username"
        );
      } else if (data?.code === "PRIVACY_BLOCKED") {
        setStatus("error");
        setMessage(data.message);
      } else if (data?.status === "accepted") {
        setStatus("already");
        setMessage("You're already contacts with this user");
      } else if (data?.status === "outgoing-pending") {
        setStatus("pending");
        setMessage("You already sent them a request");
      } else if (data?.status === "incoming-pending") {
        setStatus("pending");
        setMessage("They already sent you a request — check your pending list");
      } else {
        setStatus("error");
        setMessage(data?.message || "Something went wrong");
      }
    } finally {
      setRequestingId(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendRequest(input.trim());
  };

  const pickResult = async (u) => {
    if (u.status === "accepted") {
      onClose();
      return;
    }
    if (u.status === "outgoing-pending" || u.status === "incoming-pending") {
      setStatus("pending");
      setMessage(
        u.status === "outgoing-pending"
          ? "Request already sent"
          : "They already sent you a request — check your pending list"
      );
      return;
    }
    setRequestingId(u._id);
    await sendRequest(u.username);
  };

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-2"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-[95vh] flex flex-col rounded-2xl fade-up"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            New chat
          </h3>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 pb-3 flex-shrink-0">
          <p className="text-sm text-blue-100/70 mb-3">
            Search by <b className="text-blue-200">username</b> or{" "}
            <b className="text-blue-200">email</b>. Type at least 2 characters.
          </p>

          <form onSubmit={submit}>
            <div className="search-pill-dark flex items-center">
              {looksLikeEmail ? (
                <AtSign className="w-4 h-4 text-blue-200/70" strokeWidth={1.75} />
              ) : (
                <Search className="w-4 h-4 text-blue-200/70" strokeWidth={1.75} />
              )}
              <input
                autoFocus
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setStatus(null);
                  setMessage("");
                }}
                placeholder="Search username or email"
                disabled={status === "loading"}
              />
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
          {searching && (
            <p className="text-xs text-blue-100/50 text-center py-4">
              Searching…
            </p>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-1">
              {results.map((u) => {
                const isAccepted = u.status === "accepted";
                const isPending =
                  u.status === "outgoing-pending" ||
                  u.status === "incoming-pending";
                const isRequesting = requestingId === u._id;
                return (
                  <button
                    key={u._id}
                    onClick={() => pickResult(u)}
                    disabled={isRequesting}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition text-left disabled:opacity-60"
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full avatar-sapphire flex items-center justify-center">
                        {initial(u.username)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {u.username}
                      </p>
                      <p className="text-[11px] text-blue-100/50 truncate">
                        {/* Show the matched email if search matched on email */}
                        {u.matchedEmail
                          ? u.matchedEmail
                          : isAccepted
                          ? "Already contacts — tap to open chat"
                          : isPending
                          ? u.status === "outgoing-pending"
                            ? "Request pending"
                            : "Sent you a request"
                          : isRequesting
                          ? "Sending…"
                          : "Tap to send request"}
                      </p>
                    </div>
                    {isAccepted ? (
                      <Check
                        className="w-4 h-4 text-green-400 flex-shrink-0"
                        strokeWidth={3}
                      />
                    ) : isPending ? (
                      <Clock
                        className="w-4 h-4 text-amber-400 flex-shrink-0"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {!searching &&
            results.length === 0 &&
            input.trim().length >= 2 && (
              <p className="text-xs text-blue-100/50 text-center py-6">
                No users found matching "{input.trim()}"
              </p>
            )}

          {message && (
            <div
              className="mx-2 mt-3 flex items-start gap-2 px-3 py-3 rounded-xl text-sm"
              style={{
                backgroundColor:
                  status === "success" || status === "already"
                    ? "rgba(34, 197, 94, 0.12)"
                    : status === "pending"
                    ? "rgba(245, 158, 11, 0.12)"
                    : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${
                  status === "success" || status === "already"
                    ? "rgba(34, 197, 94, 0.30)"
                    : status === "pending"
                    ? "rgba(245, 158, 11, 0.30)"
                    : "rgba(239, 68, 68, 0.30)"
                }`,
                color:
                  status === "success" || status === "already"
                    ? "#86efac"
                    : status === "pending"
                    ? "#fcd34d"
                    : "#fca5a5",
              }}
            >
              {status === "success" && (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              {status === "pending" && (
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}
        </div>

        <div
          className="px-5 py-4 text-[11px] text-blue-100/40 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
        >
          Search respects each user's privacy settings.
        </div>
      </div>
    </div>,
    document.body
  );
}