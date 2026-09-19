import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

contactSchema.index({ sender: 1, receiver: 1 }, { unique: true });
contactSchema.index({ sender: 1, status: 1 });
contactSchema.index({ receiver: 1, status: 1 });

export default mongoose.model("Contact", contactSchema);