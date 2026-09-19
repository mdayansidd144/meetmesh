import express from "express";
import { AccessToken } from "livekit-server-sdk";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/token", protect, async (req, res) => {
  try {
    const { roomName } = req.body;
    if (!roomName) return res.status(400).json({ message: "roomName required" });

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: req.user._id.toString(),
        name: req.user.username,
        ttl: "2h",
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    res.json({ token, url: process.env.LIVEKIT_URL });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;