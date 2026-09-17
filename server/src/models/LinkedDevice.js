import mongoose from "mongoose";

const linkedDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceName: { type: String, default: "Unknown device" },
    userAgent: { type: String, default: "" },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("LinkedDevice", linkedDeviceSchema);