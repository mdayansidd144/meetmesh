import express from "express";
import LinkedDevice from "../models/LinkedDevice.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const devices = await LinkedDevice.find({ user: req.user._id }).sort({
      lastActive: -1,
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/register", protect, async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const deviceName = req.body.deviceName || "Web browser";
    const device = await LinkedDevice.create({
      user: req.user._id,
      deviceName,
      userAgent,
    });
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await LinkedDevice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;