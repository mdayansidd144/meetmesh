import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Send, Trash2, Sparkles } from "lucide-react";
import ZenithGlyph from "../components/ZenithGlyph";

const API = import.meta.env.VITE_API_URL;

export default function AIChat() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [aiUser, setAiUser] = useState(null);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  // Log any crash directly to the console so we can see it
  useEffect(() => {
    console.log("[AIChat] mounted");
    return () => console.log("[AIChat] unmounted");
  }, []);

  // Load AI user + existing history
  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/ai/me`)
      .then((r) => {
        if (cancelled) return;
        setAiUser(r.data);
        return axios.get(`${API}/messages/${r.data._id}`);
      })
      .then((r) => {
        if (cancelled || !r) return;
        const fetched = r.data.map((m) => ({
          _id: m._id,
          sender: m.sender?._id || m.sender,
          receiver: m.receiver?._id || m.receiver,
          text: m.text,
          createdAt: m.createdAt,
        }));
        setMessages(fetched);
      })
      .catch((err) => {
        console.error("[AIChat] load failed", err);
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load Zenith AI");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, sending]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const userText = text.trim();
    const token = localStorage.getItem("token");
    setText("");
    setError("");
    setStreamingText("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        sender: "me",
        receiver: aiUser?._id,
        text: userText,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Zenith AI is unavailable");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          let evt;
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }

          if (evt.type === "user") {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === tempId
                  ? {
                      _id: evt.userMessage._id,
                      sender: evt.userMessage.sender,
                      receiver: evt.userMessage.receiver,
                      text: evt.userMessage.text,
                      createdAt: evt.userMessage.createdAt,
                    }
                  : m
              )
            );
          } else if (evt.type === "token") {
            accumulated += evt.token;
            setStreamingText(accumulated);
          } else if (evt.type === "done") {
            const finalMsg = {
              _id: evt.aiMessage._id,
              sender: evt.aiMessage.sender?._id || evt.aiMessage.sender,
              receiver: evt.aiMessage.receiver,
              text: evt.aiMessage.text,
              createdAt: evt.aiMessage.createdAt,
            };
            setMessages((prev) => [...prev, finalMsg]);
            setStreamingText("");
          } else if (evt.type === "error") {
            setError(evt.message || "Zenith AI is unavailable");
          }
        }
      }
    } catch (err) {
      console.error("[AIChat] send failed", err);
      setError(err.message || "Zenith AI is unavailable");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Clear all messages with Zenith AI?")) return;
    try {
      await axios.delete(`${API}/ai/history`);
      setMessages([]);
      setStreamingText("");
    } catch (err) {
      console.error(err);
    }
  };

  const isMine = (m) => m.sender === "me" || m.sender !== aiUser?._id;

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A1A", color: "#E0E7FF" }}
    >
      <header
        className="px-4 py-3 flex items-center gap-3 safe-top"
        style={{
          backgroundColor: "rgba(15, 10, 30, 0.85)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.25)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="icon-btn-dark"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <ZenithGlyph size={40} />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Ask Zenith AI
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#FB7185" }} />
          </h2>
          <p className="text-[11px]" style={{ color: "rgba(199,210,254,0.7)" }}>
            {sending ? "Thinking…" : "Powered by Groq"}
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="icon-btn-dark"
          aria-label="Clear history"
          title="Clear history"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 scroll-thin">
        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center fade-up">
            <ZenithGlyph size={96} />
            <h3
              className="mt-5 text-2xl"
              style={{
                background: "linear-gradient(90deg, #A78BFA, #22D3EE, #FB7185)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Meet Zenith AI
            </h3>
            <p
              className="text-sm mt-2 max-w-sm"
              style={{ color: "rgba(199,210,254,0.75)" }}
            >
              Ask anything. Zenith keeps context of this conversation.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const mine = isMine(m);
          return (
            <div
              key={m._id}
              className={mine ? "flex justify-end" : "flex justify-start"}
            >
              {!mine && (
                <div className="mr-2 flex-shrink-0 self-end">
                  <ZenithGlyph size={28} />
                </div>
              )}
              <div
                className={
                  "max-w-[75%] px-4 py-2.5 text-sm rounded-2xl " +
                  (mine ? "text-white rounded-br-md" : "rounded-bl-md")
                }
                style={
                  mine
                    ? { background: "linear-gradient(135deg, #6366F1, #4F46E5)" }
                    : {
                        backgroundColor: "rgba(30, 27, 55, 0.95)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        color: "#E0E7FF",
                      }
                }
              >
                <p className="leading-relaxed break-words whitespace-pre-wrap">
                  {m.text}
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{
                    color: mine
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(199,210,254,0.55)",
                  }}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex justify-start">
            <div className="mr-2 flex-shrink-0 self-end">
              <ZenithGlyph size={28} />
            </div>
            <div
              className="rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[75%]"
              style={{
                backgroundColor: "rgba(30, 27, 55, 0.95)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                color: "#E0E7FF",
              }}
            >
              {streamingText ? (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {streamingText}
                  <span
                    className="inline-block w-1.5 h-4 ml-1 align-middle animate-pulse"
                    style={{ backgroundColor: "#22D3EE" }}
                  />
                </p>
              ) : (
                <div className="flex items-center gap-1 py-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "#22D3EE" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "#22D3EE", animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "#22D3EE", animationDelay: "300ms" }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <p
            className="text-center text-xs rounded-xl px-3 py-2"
            style={{
              color: "#FB7185",
              backgroundColor: "rgba(251, 113, 133, 0.1)",
              border: "1px solid rgba(251, 113, 133, 0.25)",
            }}
          >
            {error}
          </p>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={send}
        className="px-4 py-3 safe-bottom"
        style={{
          backgroundColor: "rgba(15, 10, 30, 0.85)",
          borderTop: "1px solid rgba(139, 92, 246, 0.25)",
        }}
      >
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{
            backgroundColor: "rgba(20, 18, 40, 0.95)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Zenith anything…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#E0E7FF" }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center transition disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            }}
            aria-label="Send"
          >
            <Send className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}