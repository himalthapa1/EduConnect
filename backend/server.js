import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import groupRoutes from "./routes/groups.js";
import sessionRoutes from "./routes/sessions.js";
import studyWithMeRoutes from "./routes/studyWithMe.js";
import { registerChatHandlers } from "./sockets/chatSocket.js";

/* =========================
   ENV + PATH SETUP
========================= */
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

/* =========================
   CREATE APP
========================= */
const app = express();
if (IS_PROD) {
  // If behind a proxy (e.g., Heroku/Render/Nginx) for correct IPs in rate limit/logging
  app.set("trust proxy", 1);
}

/* =========================
   SECURITY, COMPRESSION, LOGGING
========================= */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(morgan(IS_PROD ? "combined" : "dev"));

/* =========================
   CORS CONFIG (strict allowlist)
========================= */
const allowlist = new Set([
  process.env.FRONTEND_URL, // e.g. https://app.example.com
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
].filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl/postman) with no origin
      if (!origin) return callback(null, true);

      if (allowlist.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);

/* =========================
   RATE LIMITING (auth + uploads)
========================= */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================
   BODY PARSERS (with limits)
========================= */
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

/* =========================
   STATIC FILES (UPLOADS)
========================= */
const uploadsPath = path.join(__dirname, "..", "uploads");
try {
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
} catch (e) {
  console.error("Failed to ensure uploads directory:", e);
}
app.use(
  "/uploads",
  express.static(uploadsPath, {
    dotfiles: "ignore",
    etag: true,
    immutable: true,
    maxAge: IS_PROD ? "30d" : 0,
    redirect: false,
  })
);

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

/* =========================
   DB + ROUTES BOOTSTRAP
========================= */
let server;
(async () => {
  try {
    // Connect DB first
    await connectDB();

    // Mount routes after DB is ready
    app.use("/api/auth", authLimiter, authRoutes);
    // Apply uploadLimiter to resource create endpoints (POST)
    app.use("/api/groups", (req, res, next) => {
      if (req.method === "POST") return uploadLimiter(req, res, next);
      return next();
    }, groupRoutes);
    app.use("/api/sessions", sessionRoutes);
    app.use("/api/study-with-me", studyWithMeRoutes);

    // 404 HANDLER
    app.use((req, res) => {
      res.status(404).json({ success: false, error: { message: "Not found" } });
    });

    // GLOBAL ERROR HANDLER
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      const status = err.status || err.statusCode || 500;
      const isMulter = err.name === "MulterError";
      const isCors = /CORS/i.test(err.message || "");

      if (isMulter) {
        return res.status(400).json({ success: false, error: { message: err.message } });
      }
      if (isCors) {
        return res.status(403).json({ success: false, error: { message: "CORS: Origin not allowed" } });
      }

      if (!IS_PROD) console.error("Server error:", err);
      return res.status(status).json({
        success: false,
        error: { message: IS_PROD ? "Internal server error" : err.message },
      });
    });

    const PORT = process.env.PORT || 3001;
    server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} (${NODE_ENV})`);
    });

    /* =========================
       SOCKET.IO SETUP
    ========================= */
    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow non-browser clients (curl/postman) with no origin
          if (!origin) return callback(null, true);

          if (allowlist.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
            return callback(null, true);
          }
          return callback(new Error("CORS: Origin not allowed"));
        },
        credentials: true,
      },
    });

    // Socket.IO authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token (reuse existing logic from auth middleware)
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        // Attach user ID to socket
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Authentication failed'));
      }
    });

    // Register chat handlers
    io.on('connection', (socket) => {
      registerChatHandlers(io, socket);
    });

    console.log('✅ Socket.IO server initialized');
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();

/* =========================
   GRACEFUL SHUTDOWN
========================= */
const shutdown = async (signal) => {
  try {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close().catch(() => {});
    // Stop in-memory Mongo if started by connectDB in dev
    if (process.__MONGO_SERVER__) {
      try { await process.__MONGO_SERVER__.stop(); } catch (_) {}
    }
    console.log("Shutdown complete.");
    process.exit(0);
  } catch (e) {
    console.error("Error during shutdown:", e);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;
