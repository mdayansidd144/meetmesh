import express from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import { generateToken } from "../utils/generateToken.js";
import { protect } from "../middleware/auth.js";
import {
  uploadAvatar,
  uploadBackground,
  uploadChat,
} from "../config/upload.js";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const publicUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  provider: user.provider,
  chatTheme: user.chatTheme,
  chatBackground: user.chatBackground,
  ringtone: user.ringtone,
  ringtoneUrl: user.ringtoneUrl,
  createdAt: user.createdAt,
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      provider: "local",
    });
    res
      .status(201)
      .json({ token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (user.provider === "google" && !user.password) {
      return res.status(400).json({ message: "Use Google to sign in" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    res.json({ token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ message: "Missing credential" });
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;
    if (!email)
      return res.status(400).json({ message: "Google account has no email" });
    let user = await User.findOne({ email });
    if (user) {
      if (user.provider === "local") {
        return res.status(400).json({
          message: "Email is registered with password. Sign in normally.",
        });
      }
      user.googleId = sub;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    } else {
      let username = name || email.split("@")[0];
      const baseUsername = username;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }
      user = await User.create({
        username,
        email,
        provider: "google",
        googleId: sub,
        avatar: picture || "",
      });
    }
    res.json({ token: generateToken(user._id), user: publicUser(user) });
  } catch {
    res.status(401).json({ message: "Google verification failed" });
  }
});

router.get("/me", protect, (req, res) => res.json(publicUser(req.user)));

router.put("/me", protect, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};
    if (username && username.trim()) updates.username = username.trim();
    if (typeof bio === "string") updates.bio = bio.slice(0, 160);
    if (typeof avatar === "string") updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    });
    res.json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/me/avatar",
  protect,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
      const url = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: url },
        { new: true }
      );
      res.json(publicUser(user));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post("/me/avatar/emoji", protect, async (req, res) => {
  try {
    const seed = req.user.username || req.user.email;
    const encoded = encodeURIComponent(seed);
    const url = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encoded}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: url },
      { new: true }
    );
    res.json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/me/theme", protect, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme) return res.status(400).json({ message: "Theme required" });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { chatTheme: theme },
      { new: true }
    );
    res.json({ chatTheme: user.chatTheme });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/me/ringtone", protect, async (req, res) => {
  try {
    const { ringtone, ringtoneUrl } = req.body;
    if (!ringtone)
      return res.status(400).json({ message: "ringtone required" });
    const update = { ringtone };
    if (ringtoneUrl !== undefined) update.ringtoneUrl = ringtoneUrl;
    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
    });
    res.json({ ringtone: user.ringtone, ringtoneUrl: user.ringtoneUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/me/ringtone/upload",
  protect,
  uploadChat.single("ringtone"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
      const folder = req.file.mimetype.startsWith("audio/") ? "audio" : "files";
      const url = `${req.protocol}://${req.get("host")}/uploads/${folder}/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { ringtone: "custom", ringtoneUrl: url },
        { new: true }
      );
      res.json({ ringtone: user.ringtone, ringtoneUrl: user.ringtoneUrl });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/me/background",
  protect,
  uploadBackground.single("background"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
      const url = `${req.protocol}://${req.get("host")}/uploads/backgrounds/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { chatBackground: url },
        { new: true }
      );
      res.json({ chatBackground: user.chatBackground });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/me/background", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { chatBackground: "" },
      { new: true }
    );
    res.json({ chatBackground: user.chatBackground });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/users", protect, async (req, res) => {
  try {
    const me = req.user._id;

    const accepted = await Contact.find({
      status: "accepted",
      $or: [{ sender: me }, { receiver: me }],
    }).lean();

    const pending = await Contact.find({
      status: "pending",
      $or: [{ sender: me }, { receiver: me }],
    }).lean();

    const connectedIds = new Set();
    accepted.forEach((c) => {
      connectedIds.add(c.sender.toString());
      connectedIds.add(c.receiver.toString());
    });
    pending.forEach((c) => {
      connectedIds.add(c.sender.toString());
      connectedIds.add(c.receiver.toString());
    });
    connectedIds.delete(me.toString());

    const users = await User.find({
      _id: { $in: [...connectedIds] },
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;