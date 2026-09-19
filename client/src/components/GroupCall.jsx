import { useState, useEffect } from "react";
import axios from "axios";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

const API = import.meta.env.VITE_API_URL;

export default function GroupCall({ roomName, onClose }) {
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);

  useEffect(() => {
    axios
      .post(`${API}/livekit/token`, { roomName })
      .then((r) => {
        setToken(r.data.token);
        setServerUrl(r.data.url);
      })
      .catch((err) => console.error(err));
  }, [roomName]);

  if (!token || !serverUrl) return <div>Connecting…</div>;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000" }}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={onClose}
        data-lk-theme="default"
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}