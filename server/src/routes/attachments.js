import express from "express";
import fs from "fs";
import { protect } from "../middleware/auth.js";
import { uploadChat } from "../config/upload.js";

const router = express.Router();

router.post(
  "/upload",
  protect,
  uploadChat.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (!fs.existsSync(req.file.path)) {
        return res.status(500).json({ message: "File was not saved" });
      }
      const mime = req.file.mimetype || "";
      let kind = "file";
      if (mime.startsWith("image/")) kind = "image";
      else if (mime.startsWith("audio/")) kind = "audio";

      let folder = "files";
      if (kind === "image") folder = "images";
      else if (kind === "audio") folder = "audio";

      const url = `${req.protocol}://${req.get("host")}/uploads/${folder}/${req.file.filename}`;
      res.json({
        url,
        name: req.file.originalname,
        size: req.file.size,
        mime,
        kind,
        duration: Number(req.body.duration) || 0,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;