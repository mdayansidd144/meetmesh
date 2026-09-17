
// import "dotenv/config";
// import express from "express";
// import http from "http";
// import cors from "cors";
// import path from "path";
// import { Server } from "socket.io";
// import { connectDB } from "./config/db.js";
// import authRoutes from "./routes/auth.js";
// import messageRoutes from "./routes/messages.js";
// import roomRoutes from "./routes/rooms.js";
// import reactionRoutes from "./routes/reactions.js";
// import attachmentRoutes from "./routes/attachments.js";
// import signalRoutes from "./routes/signals.js";
// import settingsRoutes from "./routes/settings.js";
// import broadcastRoutes from "./routes/broadcasts.js";
// import listRoutes from "./routes/lists.js";
// import deviceRoutes from "./routes/devices.js";
// import pushRoutes from "./routes/push.js";
// import { socketHandler } from "./socket/socketHandler.js";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   },
//   // ⚡ Faster dead-socket detection
//   pingInterval: 10000,
//   pingTimeout: 8000,
//   // ⚡ Polling fallback for restrictive networks
//   transports: ["websocket", "polling"],
//   upgradeTimeout: 5000,
// });

// app.set("io", io);

// app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
// app.use(express.json());

// app.use(
//   "/uploads",
//   express.static(path.join(process.cwd(), "uploads"), {
//     setHeaders: (res, filePath) => {
//       if (filePath.endsWith(".webm")) {
//         res.setHeader("Content-Type", "audio/webm");
//       } else if (filePath.endsWith(".ogg")) {
//         res.setHeader("Content-Type", "audio/ogg");
//       } else if (filePath.endsWith(".m4a")) {
//         res.setHeader("Content-Type", "audio/mp4");
//       }
//     },
//   })
// );

// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/rooms", roomRoutes);
// app.use("/api/reactions", reactionRoutes);
// app.use("/api/attachments", attachmentRoutes);
// app.use("/api/signals", signalRoutes);
// app.use("/api/settings", settingsRoutes);
// app.use("/api/broadcasts", broadcastRoutes);
// app.use("/api/lists", listRoutes);
// app.use("/api/devices", deviceRoutes);
// app.use("/api/push", pushRoutes);

// app.get("/", (req, res) => res.send("MeetMesh API running"));

// socketHandler(io);

// const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
//   server.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// });
import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import roomRoutes from "./routes/rooms.js";
import reactionRoutes from "./routes/reactions.js";
import attachmentRoutes from "./routes/attachments.js";
import signalRoutes from "./routes/signals.js";
import settingsRoutes from "./routes/settings.js";
import broadcastRoutes from "./routes/broadcasts.js";
import listRoutes from "./routes/lists.js";
import deviceRoutes from "./routes/devices.js";
import pushRoutes from "./routes/push.js";
import { socketHandler } from "./socket/socketHandler.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 8000,
  transports: ["websocket", "polling"],
  upgradeTimeout: 5000,
});

app.set("io", io);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".webm")) {
        res.setHeader("Content-Type", "audio/webm");
      } else if (filePath.endsWith(".ogg")) {
        res.setHeader("Content-Type", "audio/ogg");
      } else if (filePath.endsWith(".m4a")) {
        res.setHeader("Content-Type", "audio/mp4");
      }
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/push", pushRoutes);

app.get("/", (req, res) => res.send("MeetMesh API running"));

socketHandler(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});