import mongoose from "mongoose";

const signalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      maxlength: 280,
    },
    image: {
      type: String,
      default: "",
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

signalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Signal", signalSchema);