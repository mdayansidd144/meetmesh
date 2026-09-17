import express from "express";
import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

router.get("/public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post("/subscribe", protect, async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user: req.user._id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: userAgent || "",
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/unsubscribe", protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({
        endpoint,
        user: req.user._id,
      });
    } else {
      await PushSubscription.deleteMany({ user: req.user._id });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/test", protect, async (req, res) => {
  try {
    const subs = await PushSubscription.find({ user: req.user._id });
    const payload = JSON.stringify({
      title: "MeetMesh",
      body: "This is a test notification",
      icon: "/favicon.svg",
      tag: "test",
    });
    let sent = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          payload
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: s._id });
        }
      }
    }
    res.json({ sent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export const sendPushToUser = async (userId, payload) => {
  try {
    const subs = await PushSubscription.find({ user: userId });
    if (subs.length === 0) return;
    const data = JSON.stringify(payload);
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          data
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: s._id });
        }
      }
    }
  } catch (err) {
    console.error("push error:", err.message);
  }
};

export default router;