import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 160,
    },
    chatTheme: {
      type: String,
      default: "sapphire",
    },
    chatBackground: {
      type: String,
      default: "",
    },
    online: {
      type: Boolean,
      default: false,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    starredMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    settings: {
      privacy: {
        lastSeen: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
        profilePhoto: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
        about: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
        readReceipts: { type: Boolean, default: true },
        status: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
      },
      notifications: {
        messages: { type: Boolean, default: true },
        groups: { type: Boolean, default: true },
        calls: { type: Boolean, default: true },
        sounds: { type: Boolean, default: true },
        browser: { type: Boolean, default: false },
      },
      chats: {
        enterToSend: { type: Boolean, default: true },
        mediaAutoDownload: { type: Boolean, default: true },
        wallpaperQuick: { type: Boolean, default: true },
      },
      accessibility: {
        fontSize: {
          type: String,
          enum: ["small", "medium", "large"],
          default: "medium",
        },
        highContrast: { type: Boolean, default: false },
        reducedMotion: { type: Boolean, default: false },
      },
      language: { type: String, default: "en" },
      broadcasts: {
        whoCanAdd: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "contacts",
        },
      },
      parental: {
        enabled: { type: Boolean, default: false },
        pinHash: { type: String, default: "" },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);