import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Current security status
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const s = user.security || {};
    res.json({
      methods: s.methods || [],
      pinLength: s.pinLength || 4,
      hasPin: !!s.pinHash,
      hasVoice: (s.voicePrint || []).length > 0,
      hasWebauthn: !!s.webauthn?.credentialId,
      voicePassphrase: s.voicePassphrase || "",
      webauthn: {
        credentialId: s.webauthn?.credentialId || "",
        rawIdBase64: s.webauthn?.rawIdBase64 || "",
        transports: s.webauthn?.transports || [],
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PIN
router.put("/pin", protect, async (req, res) => {
  try {
    const { pin, length } = req.body;
    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ message: "PIN must be 4–6 digits" });
    }
    const hash = await bcrypt.hash(pin, 10);
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "security.pinHash": hash,
        "security.pinLength": length || pin.length,
      },
      $addToSet: { "security.methods": "pin" },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/pin/verify", protect, async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id).select(
      "+security.pinHash",
    );
    if (!user.security?.pinHash) {
      return res.status(400).json({ message: "No PIN set" });
    }
    const ok = await bcrypt.compare(String(pin), user.security.pinHash);
    res.json({ ok });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/pin", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { "security.pinHash": "" },
      $pull: { "security.methods": "pin" },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Voice
router.put("/voice", protect, async (req, res) => {
  try {
    const { voicePrint, passphrase } = req.body;
    if (!Array.isArray(voicePrint) || voicePrint.length < 10) {
      return res.status(400).json({ message: "Invalid voice print" });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "security.voicePrint": voicePrint,
        "security.voicePassphrase": passphrase || "",
      },
      $addToSet: { "security.methods": "voice" },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/voice", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { "security.voicePrint": [], "security.voicePassphrase": "" },
      $pull: { "security.methods": "voice" },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// WebAuthn
router.put("/webauthn", protect, async (req, res) => {
  try {
    const { credentialId, rawIdBase64, transports } = req.body;
    if (!credentialId) {
      return res.status(400).json({ message: "credentialId required" });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "security.webauthn.credentialId": credentialId,
        "security.webauthn.rawIdBase64": rawIdBase64 || "",
        "security.webauthn.transports": Array.isArray(transports)
          ? transports
          : [],
        "security.webauthn.createdAt": new Date(),
      },
      $addToSet: { "security.methods": "biometric" },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/webauthn", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "security.webauthn.credentialId": "",
        "security.webauthn.rawIdBase64": "",
        "security.webauthn.transports": [],
        "security.webauthn.createdAt": null,
      },
      $pull: { "security.methods": "biometric" },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;