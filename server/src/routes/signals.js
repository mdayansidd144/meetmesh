import express from "express";
import fs from "fs";
import Signal from "../models/Signal.js";
import { protect } from "../middleware/auth.js";
import { uploadSignal } from "../config/upload.js";
const router = express.Router();
router.get("/", protect, async (req, res) => {
  try {
    const signals = await Signal.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });
    res.json(signals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, uploadSignal.single("image"), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text && !req.file) {
      return res.status(400).json({ message: "Text or image required" });
    }
    let imageUrl = "";
    if (req.file) {
      if (!fs.existsSync(req.file.path)) {
        return res.status(500).json({ message: "File was not saved" });
      }
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/signals/${req.file.filename}`;
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const signal = await Signal.create({
      user: req.user._id,
      text: text || "",
      image: imageUrl,
      expiresAt,
    });
    const populated = await signal.populate("user", "username avatar");
    const io = req.app.get("io");
    if (io) io.emit("signal:new", populated.toObject());
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:signalId/view", protect, async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.signalId);
    if (!signal) return res.status(404).json({ message: "Not found" });
    if (!signal.viewers.some((v) => v.toString() === req.user._id.toString())) {
      signal.viewers.push(req.user._id);
      await signal.save();
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:signalId", protect, async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.signalId);
    if (!signal) return res.status(404).json({ message: "Not found" });
    if (signal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not yours" });
    }
    await Signal.findByIdAndDelete(req.params.signalId);
    const io = req.app.get("io");
    if (io) io.emit("signal:deleted", { signalId: req.params.signalId });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;