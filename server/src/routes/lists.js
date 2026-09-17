import express from "express";
import ContactList from "../models/ContactList.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const lists = await ContactList.find({ owner: req.user._id })
      .populate("members", "username avatar")
      .sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name required" });
    }
    const list = await ContactList.create({
      owner: req.user._id,
      name: name.trim(),
      members: Array.isArray(memberIds) ? memberIds : [],
    });
    const populated = await list.populate("members", "username avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (Array.isArray(memberIds)) update.members = memberIds;
    const list = await ContactList.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      update,
      { new: true }
    ).populate("members", "username avatar");
    if (!list) return res.status(404).json({ message: "Not found" });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await ContactList.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;