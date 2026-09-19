import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
};

export const usePushNotifications = (user) => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const registrationRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  const ensureRegistration = async () => {
    if (!registrationRef.current) {
      registrationRef.current = await navigator.serviceWorker.register(
        "/sw.js"
      );
    }
    return registrationRef.current;
  };

  const enable = async () => {
    if (!supported) return false;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await ensureRegistration();
      await navigator.serviceWorker.ready;

      const { data } = await axios.get(`${API}/push/public-key`);
      const publicKey = data.publicKey;
      if (!publicKey) return false;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await axios.post(`${API}/push/subscribe`, {
        subscription: sub.toJSON(),
        userAgent: navigator.userAgent,
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("push enable failed", err);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await axios.post(`${API}/push/unsubscribe`, {
          endpoint: sub.endpoint,
        });
        await sub.unsubscribe();
      } else {
        await axios.post(`${API}/push/unsubscribe`, {});
      }
      setSubscribed(false);
    } catch (err) {
      console.error("push disable failed", err);
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    try {
      const { data } = await axios.post(`${API}/push/test`);
      return data.sent;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    if (!supported || !user) return;
    const check = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      } catch {
        setSubscribed(false);
      }
    };
    check();
  }, [supported, user?._id]);

  return { supported, permission, subscribed, busy, enable, disable, test };
};