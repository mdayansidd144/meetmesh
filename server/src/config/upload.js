import multer from "multer";
import path from "path";
import fs from "fs";
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
const IMAGE_DIR = path.join(UPLOAD_ROOT, "images");
const AUDIO_DIR = path.join(UPLOAD_ROOT, "audio");
const FILE_DIR = path.join(UPLOAD_ROOT, "files");
const BACKGROUND_DIR = path.join(UPLOAD_ROOT, "backgrounds");
const SIGNAL_DIR = path.join(UPLOAD_ROOT, "signals");
[
  UPLOAD_ROOT,
  AVATAR_DIR,
  IMAGE_DIR,
  AUDIO_DIR,
  FILE_DIR,
  BACKGROUND_DIR,
  SIGNAL_DIR,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created upload directory: ${dir}`);
  }
});

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = FILE_DIR;
    if (file.mimetype.startsWith("image/")) folder = IMAGE_DIR;
    else if (file.mimetype.startsWith("audio/")) folder = AUDIO_DIR;

    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const chatFileFilter = (req, file, cb) => {
  const allowed =
    /jpeg|jpg|png|webp|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|mp3|wav|webm|ogg|m4a/;
  const ext = path.extname(file.originalname).toLowerCase();
  const ok =
    allowed.test(ext) ||
    file.mimetype.startsWith("audio/") ||
    file.mimetype.startsWith("image/");
  cb(ok ? null : new Error("File type not allowed"), ok);
};

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const avatarFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok =
    allowed.test(file.mimetype) &&
    allowed.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error("Only image files are allowed"), ok);
};

const backgroundStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(BACKGROUND_DIR))
      fs.mkdirSync(BACKGROUND_DIR, { recursive: true });
    cb(null, BACKGROUND_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const backgroundFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok =
    allowed.test(file.mimetype) &&
    allowed.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error("Only image files are allowed"), ok);
};

const signalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(SIGNAL_DIR))
      fs.mkdirSync(SIGNAL_DIR, { recursive: true });
    cb(null, SIGNAL_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const signalFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok =
    allowed.test(file.mimetype) &&
    allowed.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error("Only image files are allowed"), ok);
};
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
export const uploadChat = multer({
  storage: chatStorage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});
export const uploadBackground = multer({
  storage: backgroundStorage,
  fileFilter: backgroundFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});
export const uploadSignal = multer({
  storage: signalStorage,
  fileFilter: signalFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});