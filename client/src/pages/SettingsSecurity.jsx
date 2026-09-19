import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import SettingsHeader from "../components/SettingsHeader";
import { Lock, Fingerprint, Mic, Loader2 } from "lucide-react";
import {
  createRecorder,
  extractVoicePrint,
  createLevelMeter,
} from "../lib/voiceprint";
import {
  isPlatformAuthenticatorAvailable,
  registerCredential,
} from "../lib/webauthn";

const API = import.meta.env.VITE_API_URL;

export default function SettingsSecurity() {
  const { user } = useAuth();
  const [status, setStatus] = useState({
    methods: [],
    hasPin: false,
    hasVoice: false,
    hasWebauthn: false,
    pinLength: 4,
    voicePassphrase: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLength, setPinLength] = useState(4);

  const [voiceMode, setVoiceMode] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [recording, setRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const recorderRef = useRef(null);
  const meterRef = useRef(null);
  const rafRef = useRef(null);

  const load = () => {
    axios
      .get(`${API}/security/me`)
      .then((r) => setStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const savePin = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setMessage("PIN must be 4–6 digits");
      return;
    }
    try {
      await axios.put(`${API}/security/pin`, { pin, length: pinLength });
      setMessage("PIN saved");
      setPinMode(false);
      setPin("");
      load();
    } catch {
      setMessage("Failed to save PIN");
    }
  };

  const removePin = async () => {
    if (!window.confirm("Remove PIN lock?")) return;
    await axios.delete(`${API}/security/pin`);
    load();
  };

  // ── Voice ──
  const startVoiceSample = async () => {
    setMessage("");
    setError("");
    if (!passphrase.trim()) {
      setError("Type a passphrase first");
      return;
    }

    // Start the level meter first so user can see mic input
    try {
      const meter = await createLevelMeter();
      meterRef.current = meter;
      const loop = () => {
        if (meterRef.current) {
          setMicLevel(meterRef.current.level());
          rafRef.current = requestAnimationFrame(loop);
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setError("Microphone permission denied");
      return;
    }

    // Then start recording
    try {
      const rec = await createRecorder();
      recorderRef.current = rec;
      rec.start();
      setRecording(true);

      setTimeout(async () => {
        try {
          const blob = await rec.stop();
          recorderRef.current = null;
          const print = await extractVoicePrint(blob);
          await axios.put(`${API}/security/voice`, {
            voicePrint: print,
            passphrase,
          });
          setMessage("Voice print saved");
          setVoiceMode(false);
          setPassphrase("");
          load();
        } catch (err) {
          if (err.message === "silent") {
            setError(
              "Recording was silent — check your mic and speak clearly",
            );
          } else {
            setError("Failed to save voice print");
            console.error(err);
          }
        } finally {
          setRecording(false);
          // Stop meter
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          meterRef.current?.stop();
          meterRef.current = null;
          setMicLevel(0);
        }
      }, 3000); // 3 s — a bit longer so you have time to speak
    } catch {
      setError("Microphone denied");
      setRecording(false);
      meterRef.current?.stop();
      meterRef.current = null;
    }
  };

  const removeVoice = async () => {
    if (!window.confirm("Remove voice unlock?")) return;
    await axios.delete(`${API}/security/voice`);
    load();
  };

  const setupBiometric = async () => {
    setMessage("");
    try {
      const available = await isPlatformAuthenticatorAvailable();
      if (!available) {
        setMessage("No biometric hardware detected on this device");
        return;
      }
      const result = await registerCredential(user);
      if (!result) {
        setMessage("Registration was cancelled or failed");
        return;
      }
      await axios.put(`${API}/security/webauthn`, result);
      setMessage("Biometric enabled — try the lock screen");
      load();
    } catch (err) {
      setMessage("Biometric setup failed");
      console.error(err);
    }
  };

  const removeBiometric = async () => {
    if (!window.confirm("Remove biometric unlock?")) return;
    await axios.delete(`${API}/security/webauthn`);
    load();
  };

  if (loading)
    return (
      <div className="settings-page">
        <SettingsHeader title="Security" />
        <p className="settings-empty">Loading…</p>
      </div>
    );

  return (
    <div className="settings-page">
      <SettingsHeader title="Security" />
      <p className="settings-hint">
        Lock MeetMesh on this device. Any enabled method can unlock the app.
      </p>

      {message && (
        <p className="text-sm text-blue-600 bg-blue-50 rounded-xl mx-5 mb-3 px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl mx-5 mb-3 px-3 py-2">
          {error}
        </p>
      )}

      {/* PIN */}
      <div className="settings-row-static">
        <div className="w-10 h-10 rounded-2xl avatar-sapphire flex items-center justify-center">
          <Lock className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="settings-row-label">PIN lock</p>
          <p className="settings-row-description">
            {status.hasPin ? `${status.pinLength}-digit PIN is set` : "Not set"}
          </p>
        </div>
        {status.hasPin ? (
          <button
            onClick={removePin}
            className="text-sm text-red-400 font-medium"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={() => setPinMode(true)}
            className="text-sm text-blue-400 font-medium"
          >
            Set
          </button>
        )}
      </div>

      {pinMode && (
        <div className="settings-block">
          <p className="settings-label">Choose PIN length</p>
          <div className="flex gap-2 mt-2 mb-4">
            {[4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPinLength(n)}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition ${
                  pinLength === n
                    ? "bg-blue-500/20 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-blue-100/70"
                }`}
              >
                {n} digits
              </button>
            ))}
          </div>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, pinLength))
            }
            className="input-dark"
            placeholder={`${pinLength}-digit PIN`}
          />
          <div className="flex gap-3 mt-4">
            <button onClick={savePin} className="btn-sapphire flex-1">
              Save PIN
            </button>
            <button
              onClick={() => {
                setPinMode(false);
                setPin("");
              }}
              className="btn-outline-sapphire flex-1 justify-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Biometric */}
      <div className="settings-row-static">
        <div className="w-10 h-10 rounded-2xl avatar-sapphire flex items-center justify-center">
          <Fingerprint className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="settings-row-label">Biometric unlock</p>
          <p className="settings-row-description">
            {status.hasWebauthn
              ? "Fingerprint / Face ID / Windows Hello enabled"
              : "Windows Hello, fingerprint, or Face ID"}
          </p>
        </div>
        {status.hasWebauthn ? (
          <button
            onClick={removeBiometric}
            className="text-sm text-red-400 font-medium"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={setupBiometric}
            className="text-sm text-blue-400 font-medium"
          >
            Set
          </button>
        )}
      </div>

      {/* Voice */}
      <div className="settings-row-static">
        <div className="w-10 h-10 rounded-2xl avatar-sapphire flex items-center justify-center">
          <Mic className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="settings-row-label">Voice unlock</p>
          <p className="settings-row-description">
            {status.hasVoice
              ? `Passphrase: "${status.voicePassphrase}"`
              : "Say a short phrase to unlock"}
          </p>
        </div>
        {status.hasVoice ? (
          <button
            onClick={removeVoice}
            className="text-sm text-red-400 font-medium"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={() => setVoiceMode(true)}
            className="text-sm text-blue-400 font-medium"
          >
            Set
          </button>
        )}
      </div>

      {voiceMode && (
        <div className="settings-block">
          <p className="settings-hint text-xs">
            This is a <b>convenience lock</b>, not cryptographic security.
          </p>

          <input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Type the phrase you'll say (e.g. 'open sesame')"
            className="input-dark mb-3"
            disabled={recording}
          />

          {/* Live mic-level meter */}
          {recording && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-1">
                Mic level — speak now:
              </p>
              <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.round(micLevel * 100)}%`,
                    backgroundColor:
                      micLevel > 0.15
                        ? "#22c55e" // green — good level
                        : micLevel > 0.05
                          ? "#f59e0b" // amber — quiet
                          : "#ef4444", // red — silent
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={startVoiceSample}
            disabled={recording}
            className="btn-sapphire w-full flex items-center justify-center gap-2"
          >
            {recording ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recording… say it now
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Record sample
              </>
            )}
          </button>

          <button
            onClick={() => {
              setVoiceMode(false);
              setPassphrase("");
              setError("");
            }}
            className="btn-outline-sapphire w-full justify-center mt-3"
            disabled={recording}
          >
            Cancel
          </button>
        </div>
      )}

      <p className="settings-hint text-xs mt-6">
        <b>Note:</b> Biometric uses Windows Hello / fingerprint / Face ID — your
        device handles the match, MeetMesh never sees your fingerprint or face.
      </p>
    </div>
  );
}