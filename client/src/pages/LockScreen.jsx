import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLockContext } from "../context/LockContext";
import {
  compareVoicePrints,
  createRecorder,
  extractVoicePrint,
} from "../lib/voiceprint";
import { assertCredential } from "../lib/webauthn";
import { Fingerprint, Mic, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LockScreen({ onUnlock }) {
  const { user } = useAuth();
  const lock = useLockContext();
  const [mode, setMode] = useState("pin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const recorderRef = useRef(null);

  const methods = lock.status?.methods || [];
  const hasPin = methods.includes("pin");
  const hasVoice = methods.includes("voice");
  const hasBio = methods.includes("biometric");

  useEffect(() => {
    if (hasPin) setMode("pin");
    else if (hasBio) setMode("biometric");
    else if (hasVoice) setMode("voice");
  }, [hasPin, hasBio, hasVoice]);

  const submitPin = async (value) => {
    setError("");
    const ok = await lock.verifyPin(value);
    if (ok) onUnlock();
    else {
      setError("Incorrect PIN");
      setPin("");
    }
  };

  const handleKey = (key) => {
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((prev) => {
      if (prev.length >= (lock.status?.pinLength || 4)) return prev;
      const next = prev + key;
      if (next.length === (lock.status?.pinLength || 4)) {
        setTimeout(() => submitPin(next), 100);
      }
      return next;
    });
  };

  const unlockWithBiometric = async () => {
    setError("");
    setBioBusy(true);
    try {
      const ok = await assertCredential(lock.status?.webauthn);
      if (ok) onUnlock();
      else {
        setError("Biometric failed — use PIN");
        if (hasPin) setMode("pin");
      }
    } catch {
      setError("Biometric failed — use PIN");
      if (hasPin) setMode("pin");
    } finally {
      setBioBusy(false);
    }
  };

  const startVoiceUnlock = async () => {
    setError("");
    if (!lock.status?.hasVoice) {
      setError("No voice print saved");
      return;
    }
    try {
      setVoiceBusy(true);
      const rec = await createRecorder();
      recorderRef.current = rec;
      rec.start();
      setTimeout(async () => {
        try {
          const blob = await rec.stop();
          recorderRef.current = null;
          const print = await extractVoicePrint(blob);
          const { data } = await axios.get(
            `${import.meta.env.VITE_API_URL}/security/me`,
          );
          const stored = data.voicePrint || [];
          const score = compareVoicePrints(print, stored);
          if (score >= 0.6) onUnlock();
          else {
            setError("Voice did not match — try again or use PIN");
            if (hasPin) setTimeout(() => setMode("pin"), 1500);
          }
        } catch (err) {
          if (err.message === "silent") {
            setError("Recording was silent — please speak louder");
          } else {
            setError("Voice capture failed");
          }
        } finally {
          setVoiceBusy(false);
        }
      }, 3000);
    } catch {
      setVoiceBusy(false);
      setError("Microphone access denied");
    }
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const pinLength = lock.status?.pinLength || 4;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 99999, backgroundColor: "#f4f5f7" }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-3xl text-center"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
        }}
      >
        <div className="w-16 h-16 mx-auto rounded-2xl logo-sapphire text-3xl flex items-center justify-center">
          M
        </div>
        <h1 className="mt-5 text-2xl font-extrabold brand-sapphire-inverse">
          MeetMesh is locked
        </h1>
        <p className="text-sm text-slate-600 mt-1">Unlock to continue</p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-4">
            {error}
          </p>
        )}

        {mode === "pin" && hasPin && (
          <>
            <div className="flex justify-center gap-3 mt-6">
              {Array.from({ length: pinLength }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5 rounded-full transition",
                    i < pin.length ? "bg-blue-500" : "bg-slate-300",
                  )}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleKey(String(n))}
                  className="py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-lg font-bold text-slate-900 transition select-none"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKey("del")}
                className="py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center transition"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleKey("0")}
                className="py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-lg font-bold text-slate-900 transition select-none"
              >
                0
              </button>
              <div />
            </div>
          </>
        )}

        {mode === "biometric" && hasBio && (
          <button
            type="button"
            onClick={unlockWithBiometric}
            disabled={bioBusy}
            className={cn(
              "mt-8 w-full py-6 rounded-2xl flex flex-col items-center gap-2 transition",
              bioBusy
                ? "bg-slate-400 text-white"
                : "bg-gradient-to-br from-blue-500 to-blue-700 text-white",
            )}
          >
            <Fingerprint className="w-10 h-10" />
            <span className="font-semibold">
              {bioBusy ? "Waiting for Windows Hello…" : "Unlock with biometric"}
            </span>
          </button>
        )}

        {mode === "voice" && hasVoice && (
          <button
            type="button"
            onClick={startVoiceUnlock}
            disabled={voiceBusy}
            className={cn(
              "mt-8 w-full py-6 rounded-2xl flex flex-col items-center gap-2 transition",
              voiceBusy
                ? "bg-red-500 text-white"
                : "bg-gradient-to-br from-blue-500 to-blue-700 text-white",
            )}
          >
            <Mic className="w-10 h-10" />
            <span className="font-semibold">
              {voiceBusy ? "Listening…" : "Unlock with voice"}
            </span>
            {voiceBusy && (
              <span className="text-xs opacity-80">
                Speak your passphrase now (3 s)
              </span>
            )}
          </button>
        )}

        <div className="flex justify-center gap-3 mt-8">
          {hasPin && mode !== "pin" && (
            <button
              type="button"
              onClick={() => setMode("pin")}
              className="text-xs text-blue-600 font-semibold"
            >
              Use PIN
            </button>
          )}
          {hasBio && mode !== "biometric" && (
            <button
              type="button"
              onClick={() => setMode("biometric")}
              className="text-xs text-blue-600 font-semibold"
            >
              Use biometric
            </button>
          )}
          {hasVoice && mode !== "voice" && (
            <button
              type="button"
              onClick={() => setMode("voice")}
              className="text-xs text-blue-600 font-semibold"
            >
              Use voice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}