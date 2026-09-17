import { useState } from "react";
import axios from "axios";
import SettingsHeader from "../components/SettingsHeader";
import { ChevronDown, ChevronUp } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const FAQ = [
  {
    q: "How do I start a video call?",
    a: "Open any chat and tap the video icon at the top right of the chat header. The other person will receive an incoming call alert.",
  },
  {
    q: "Can I recover a deleted message?",
    a: "No. Deleting a message removes it permanently once both sides delete it.",
  },
  {
    q: "How do voice notes work?",
    a: "With the message input empty, tap the microphone button. Tap the red square to stop recording. The note uploads automatically.",
  },
  {
    q: "Is my data encrypted?",
    a: "Your session is protected with JWT authentication. Media is stored on the server. End-to-end encryption is not yet enabled.",
  },
  {
    q: "How do I block someone?",
    a: "Open Settings, then Privacy. Scroll to the block section and select the user from the list.",
  },
];

export default function SettingsHelp() {
  const [open, setOpen] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const submit = async () => {
    if (!message.trim()) return;
    try {
      await axios.post(`${API}/settings/feedback`, { subject, message });
      setStatus("Thank you. Your feedback was sent.");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("Could not send. Try again later.");
    }
  };

  return (
    <div className="settings-page">
      <SettingsHeader title="Help and feedback" />
      <div className="settings-section-title">FAQ</div>
      {FAQ.map((item, i) => (
        <div key={i} className="settings-faq">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="settings-faq-question"
          >
            <span>{item.q}</span>
            {open === i ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
          {open === i && (
            <p className="settings-faq-answer">{item.a}</p>
          )}
        </div>
      ))}
      <div className="settings-section-title">Send feedback</div>
      <div className="settings-block">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="input-dark"
        />
      </div>
      <div className="settings-block">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Tell us what you think or report a problem"
          className="input-dark"
        />
      </div>
      <button onClick={submit} className="btn-sapphire w-full">
        Send
      </button>
      {status && <p className="settings-message">{status}</p>}
    </div>
  );
}