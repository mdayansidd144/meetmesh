import mongoose from "mongoose";
const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, default: "" },
    size: { type: Number, default: 0 },
    mime: { type: String, default: "" },
    kind: {
      type: String,
      enum: ["image", "audio", "file"],
      default: "file",
    },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "call_voice", "call_video", "attachment", "broadcast"],
      default: "text",
    },
    attachment: {
      type: attachmentSchema,
      default: null,
    },
    callMeta: {
      status: {
        type: String,
        enum: ["answered", "missed", "declined", "cancelled", null],
        default: null,
      },
      duration: { type: Number, default: 0 },
    },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    reactions: { type: [reactionSchema], default: [] },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
messageSchema.index({ text: "text" });

export default mongoose.model("Message", messageSchema);