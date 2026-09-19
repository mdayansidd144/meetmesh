import express from "express";
import Contact from "../models/Contact.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();
router.get("/", protect, async (req, res) => {
  try {
    const me = req.user._id;
    const contacts = await Contact.find({
      status: "accepted",
      $or: [{ sender: me }, { receiver: me }],
    })
      .populate("sender", "username avatar email")
      .populate("receiver", "username avatar email")
      .sort({ updatedAt: -1 })
      .lean();

    const result = contacts
      .map((c) => {
        if (!c.sender || !c.receiver) return null;
        const other =
          c.sender._id.toString() === me.toString() ? c.receiver : c.sender;
        return {
          contactId: c._id,
          user: {
            _id: other._id,
            username: other.username,
            avatar: other.avatar,
          },
          acceptedAt: c.updatedAt,
        };
      })
      .filter(Boolean);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/contacts/pending ───
router.get("/pending", protect, async (req, res) => {
  try {
    const pending = await Contact.find({
      receiver: req.user._id,
      status: "pending",
    })
      .populate("sender", "username avatar email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      pending
        .filter((c) => c.sender)
        .map((c) => ({
          requestId: c._id,
          from: {
            _id: c.sender._id,
            username: c.sender.username,
            avatar: c.sender.avatar,
          },
          message: c.message || "",
          createdAt: c.createdAt,
        }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/contacts/outgoing ───
router.get("/outgoing", protect, async (req, res) => {
  try {
    const outgoing = await Contact.find({
      sender: req.user._id,
      status: "pending",
    })
      .populate("receiver", "username avatar email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      outgoing
        .filter((c) => c.receiver)
        .map((c) => ({
          requestId: c._id,
          to: {
            _id: c.receiver._id,
            username: c.receiver.username,
            avatar: c.receiver.avatar,
          },
          message: c.message || "",
          createdAt: c.createdAt,
        }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/contacts/status/:userId ───
router.get("/status/:userId", protect, async (req, res) => {
  try {
    const me = req.user._id.toString();
    const other = req.params.userId;
    if (me === other) return res.json({ status: "self" });

    const c = await Contact.findOne({
      $or: [
        { sender: me, receiver: other },
        { sender: other, receiver: me },
      ],
    }).lean();

    if (!c) return res.json({ status: "none" });
    if (c.status === "accepted") return res.json({ status: "accepted" });
    if (c.status === "pending") {
      const isOutgoing = c.sender.toString() === me;
      return res.json({
        status: isOutgoing ? "outgoing-pending" : "incoming-pending",
        requestId: c._id,
      });
    }
    const declinedByThem =
      c.receiver.toString() === me && c.status === "declined";
    return res.json({
      status: declinedByThem ? "declined-by-me" : "declined-by-them",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/search", protect, async (req, res) => {
  try {
    const raw = (req.query.q || "").trim();

    // Reject bare "@", "@x", or single-char queries
    const hasAt = raw.includes("@");
    if (hasAt) {
      const beforeAt = raw.split("@")[0];
      const afterAt = raw.split("@")[1] || "";
      // Require at least 2 chars on one side of the @
      if (beforeAt.length < 2 && afterAt.length < 2) {
        return res.json({ results: [] });
      }
    } else {
      // No @ — require at least 2 chars
      if (raw.length < 2) return res.json({ results: [] });
    }

    const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const me = req.user._id;

    // Two separate queries so privacy fields can differ per match type
    const usernameMatches = await User.find({
      _id: { $ne: me },
      username: { $regex: safe, $options: "i" },
      "settings.privacy.discoverable": "everyone",
    })
      .select("_id username avatar email")
      .limit(30)
      .lean();

    const emailMatches = hasAt
      ? await User.find({
          _id: { $ne: me },
          email: { $regex: safe, $options: "i" },
          "settings.privacy.discoverableByEmail": "everyone",
        })
        .select("_id username avatar email")
        .limit(30)
        .lean()
      : [];

    // Deduplicate — same user matched by both queries should appear once
    const byId = new Map();
    [...usernameMatches, ...emailMatches].forEach((u) => {
      byId.set(u._id.toString(), u);
    });
    const users = [...byId.values()];

    // Rank: prefix matches on username → prefix matches on email → shortest → alphabetical
    const q = raw.toLowerCase();
    users.sort((a, b) => {
      const aUserPrefix = a.username.toLowerCase().startsWith(q) ? 0 : 1;
      const bUserPrefix = b.username.toLowerCase().startsWith(q) ? 0 : 1;
      if (aUserPrefix !== bUserPrefix) return aUserPrefix - bUserPrefix;

      const aEmailPrefix =
        hasAt && a.email.toLowerCase().startsWith(q) ? 0 : 1;
      const bEmailPrefix =
        hasAt && b.email.toLowerCase().startsWith(q) ? 0 : 1;
      if (aEmailPrefix !== bEmailPrefix) return aEmailPrefix - bEmailPrefix;

      if (a.username.length !== b.username.length) {
        return a.username.length - b.username.length;
      }
      return a.username.localeCompare(b.username);
    });

    const trimmed = users.slice(0, 20);

    // Blocked-user filter (both directions)
    const blockedByMe = (req.user.blockedUsers || []).map(String);
    const blockedMe = await User.find({ blockedUsers: me })
      .select("_id")
      .lean();
    const excludeSet = new Set([
      ...blockedByMe,
      ...blockedMe.map((u) => u._id.toString()),
    ]);

    const filtered = trimmed.filter(
      (u) => !excludeSet.has(u._id.toString())
    );

    // Attach relationship status
    const results = await Promise.all(
      filtered.map(async (u) => {
        const c = await Contact.findOne({
          $or: [
            { sender: me, receiver: u._id },
            { sender: u._id, receiver: me },
          ],
        }).lean();

        let status = "none";
        if (c) {
          if (c.status === "accepted") status = "accepted";
          else if (c.status === "pending") {
            status =
              c.sender.toString() === me.toString()
                ? "outgoing-pending"
                : "incoming-pending";
          } else status = "declined";
        }

        // Return the email only if it matched the query (so we don't leak it otherwise)
        const emailLower = u.email?.toLowerCase() || "";
        const matchedEmail =
          hasAt && emailLower.includes(q) ? u.email : null;

        return {
          _id: u._id,
          username: u.username,
          avatar: u.avatar,
          matchedEmail,
          status,
        };
      })
    );

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post("/request", protect, async (req, res) => {
  try {
    const raw = (req.body.identifier || req.body.email || "").trim();
    if (!raw) {
      return res.status(400).json({ message: "Username or email required" });
    }

    const message = (req.body.message || "").slice(0, 200);

    const isEmail = raw.includes("@");
    const query = isEmail
      ? { email: raw.toLowerCase() }
      : {
          username: new RegExp(
            `^${raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        };

    const target = await User.findOne(query).select(
      "_id username settings.privacy.discoverable settings.privacy.discoverableByEmail blockedUsers"
    );
    if (!target) {
      return res.status(404).json({
        message: isEmail
          ? "No user found with that email"
          : "No user found with that username",
      });
    }
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't add yourself" });
    }

    const iBlockedThem = (req.user.blockedUsers || []).some(
      (id) => id.toString() === target._id.toString()
    );
    const theyBlockedMe = (target.blockedUsers || []).some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (iBlockedThem || theyBlockedMe) {
      return res.status(403).json({
        message: "You cannot send a request to this user",
        code: "PRIVACY_BLOCKED",
      });
    }

    // Privacy gate depends on how we found them
    const disc = isEmail
      ? target.settings?.privacy?.discoverableByEmail || "everyone"
      : target.settings?.privacy?.discoverable || "everyone";

    if (disc === "nobody") {
      return res.status(403).json({
        message: "This user has disabled contact requests",
        code: "PRIVACY_BLOCKED",
      });
    }

    if (disc === "contacts") {
      const alreadyContact = await Contact.findOne({
        status: "accepted",
        $or: [
          { sender: req.user._id, receiver: target._id },
          { sender: target._id, receiver: req.user._id },
        ],
      });
      if (!alreadyContact) {
        return res.status(403).json({
          message: "This user only accepts requests from existing contacts",
          code: "PRIVACY_BLOCKED",
        });
      }
    }

    const existing = await Contact.findOne({
      $or: [
        { sender: req.user._id, receiver: target._id },
        { sender: target._id, receiver: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res
          .status(400)
          .json({ message: "Already contacts", status: "accepted" });
      }
      if (existing.status === "pending") {
        const isOutgoing =
          existing.sender.toString() === req.user._id.toString();
        return res.status(400).json({
          message: isOutgoing
            ? "Request already sent"
            : "They already sent you a request — check your pending list",
          status: isOutgoing ? "outgoing-pending" : "incoming-pending",
        });
      }

      existing.status = "pending";
      existing.sender = req.user._id;
      existing.receiver = target._id;
      existing.message = message;
      await existing.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`user:${target._id}`).emit("request:received", {
          requestId: existing._id,
          from: {
            _id: req.user._id,
            username: req.user.username,
            avatar: req.user.avatar,
          },
          message,
        });
      }
      return res.json({
        ok: true,
        requestId: existing._id,
        status: "outgoing-pending",
        foundUser: { _id: target._id, username: target.username },
      });
    }

    const contact = await Contact.create({
      sender: req.user._id,
      receiver: target._id,
      status: "pending",
      message,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${target._id}`).emit("request:received", {
        requestId: contact._id,
        from: {
          _id: req.user._id,
          username: req.user.username,
          avatar: req.user.avatar,
        },
        message,
      });
    }

    res.json({
      ok: true,
      requestId: contact._id,
      status: "outgoing-pending",
      foundUser: { _id: target._id, username: target.username },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/contacts/accept/:requestId ───
router.post("/accept/:requestId", protect, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.requestId);
    if (!contact) return res.status(404).json({ message: "Request not found" });
    if (contact.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not yours to accept" });
    }
    if (contact.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    contact.status = "accepted";
    await contact.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${contact.sender}`).emit("request:accepted", {
        contactId: contact._id,
        by: {
          _id: req.user._id,
          username: req.user.username,
          avatar: req.user.avatar,
        },
      });
    }

    res.json({ ok: true, contactId: contact._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/contacts/decline/:requestId ───
router.post("/decline/:requestId", protect, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.requestId);
    if (!contact) return res.status(404).json({ message: "Request not found" });
    if (contact.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not yours to decline" });
    }

    contact.status = "declined";
    await contact.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${contact.sender}`).emit("request:declined", {
        requestId: contact._id,
      });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE /api/contacts/:contactId ───
router.delete("/:contactId", protect, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.contactId);
    if (!contact) return res.status(404).json({ message: "Not found" });
    const me = req.user._id.toString();
    if (
      contact.sender.toString() !== me &&
      contact.receiver.toString() !== me
    ) {
      return res.status(403).json({ message: "Not yours" });
    }
    await Contact.findByIdAndDelete(req.params.contactId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/contacts/migrate ───
router.post("/migrate", protect, async (req, res) => {
  try {
    const me = req.user._id.toString();

    const sentTo = await Message.distinct("receiver", { sender: me });
    const receivedFrom = await Message.distinct("sender", { receiver: me });

    const combined = [...sentTo, ...receivedFrom];

    const partnerIds = [
      ...new Set(
        combined
          .filter((id) => id !== null && id !== undefined && id !== "")
          .map((id) => id.toString())
          .filter((id) => id !== me && /^[0-9a-fA-F]{24}$/.test(id))
      ),
    ];

    let created = 0;
    let skipped = 0;

    for (const partnerId of partnerIds) {
      const existing = await Contact.findOne({
        $or: [
          { sender: me, receiver: partnerId },
          { sender: partnerId, receiver: me },
        ],
      });
      if (existing) {
        skipped++;
        continue;
      }
      try {
        await Contact.create({
          sender: me,
          receiver: partnerId,
          status: "accepted",
        });
        created++;
      } catch (err) {
        console.warn("Skipped contact:", partnerId, err.message);
        skipped++;
      }
    }

    res.json({ ok: true, created, skipped, total: partnerIds.length });
  } catch (error) {
    console.error("migrate error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;