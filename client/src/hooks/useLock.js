import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const useLock = (user) => {
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState({
    methods: [],
    hasPin: false,
    hasVoice: false,
    hasWebauthn: false,
    pinLength: 4,
    voicePassphrase: "",
    webauthn: {
      credentialId: "",
      rawIdBase64: "",
      transports: [],
    },
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user?._id) {
      setReady(true);
      return;
    }
    axios
      .get(`${API}/security/me`)
      .then((r) => {
        setStatus(r.data);
        // 🔇 Voice is temporarily disabled from the lock gate.
        // It still saves to the DB, but doesn't trigger the lock screen.
        const hasAny = r.data.hasPin || r.data.hasWebauthn;
        setLocked(hasAny);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [user?._id]);

  const verifyPin = useCallback(async (pin) => {
    try {
      const { data } = await axios.post(`${API}/security/pin/verify`, { pin });
      if (data.ok) {
        setLocked(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("PIN verify error:", err);
      return false;
    }
  }, []);

  const unlock = useCallback(() => setLocked(false), []);

  const refresh = useCallback(async () => {
    const { data } = await axios.get(`${API}/security/me`);
    setStatus(data);
    return data;
  }, []);

  return { locked, status, ready, verifyPin, unlock, refresh };
};