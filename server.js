// server.js — MyRePlayTV (clean, single-file “motor”)
// - Serves /public (frontend)
// - Health check
// - Demo token + monthly usage counter (in-memory, low cost)
// - MP4 transcode via ffmpeg (WhatsApp/IG friendly)
// - SPA fallback to public/index.html

const express = require("express");
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const { nanoid } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================
// CONFIG
// ==============================
const MAX_EXPORTS_PER_MONTH = 5;     // demo limit
const MAX_FILE_MB = 200;             // upload limit for transcode
const TMP_DIR = path.join(os.tmpdir(), "myreplaytv");

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// In-memory usage store (token -> { month: "YYYY-MM", count: number })
const usageStore = {};

// ==============================
// HELPERS
// ==============================
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDemoToken(req) {
  // Accept multiple header names for compatibility with different frontends
  return (
    req.headers["x-demo-token"] ||
    req.headers["x-mrp-token"] ||
    req.headers["x_mrp_token"] ||
    null
  );
}

function getOrInitUsage(token) {
  if (!usageStore[token]) {
    usageStore[token] = { month: currentMonthKey(), count: 0 };
  }
  const monthKey = currentMonthKey();
  if (usageStore[token].month !== monthKey) {
    usageStore[token].month = monthKey;
    usageStore[token].count = 0;
  }
  return usageStore[token];
}

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

// ==============================
// STATIC FRONTEND
// ==============================
app.use(express.static(path.join(__dirname, "public")));

// Railway health check
app.get("/health", (_req, res) => res.status(200).send("ok"));

// ==============================
// TOKEN + USAGE API
// ==============================
// Legacy / simple: create a token (no login)
app.get("/api/token", (_req, res) => {
  const token = nanoid(24);
  getOrInitUsage(token);
  res.json({
    token,
    limit: MAX_EXPORTS_PER_MONTH,
    used: 0,
    month: usageStore[token].month,
    left: MAX_EXPORTS_PER_MONTH,
  });
});

// Frontend expects this
app.get("/api/usage", (req, res) => {
  const token = getDemoToken(req);
  if (!token) return res.status(401).json({ error: "Missing token" });

  const u = getOrInitUsage(token);
  const used = u.count;
  const max = MAX_EXPORTS_PER_MONTH;
  const left = Math.max(0, max - used);

  res.json({ month: u.month, max, used, left });
});

// Frontend consumes 1 export BEFORE doing heavy work
app.post("/api/usage/consume", (req, res) => {
  const token = getDemoToken(req);
  if (!token) return res.status(401).json({ error: "Missing token" });

  const u = getOrInitUsage(token);
  const max = MAX_EXPORTS_PER_MONTH;

  if (u.count >= max) {
    return res.status(403).json({
      error: "Monthly limit reached",
      month: u.month,
      max,
      used: u.count,
      left: 0,
    });
  }

  u.count++;

  res.json({
    month: u.month,
    max,
    used: u.count,
    left: Math.max(0, max - u.count),
  });
});

// ==============================
// MULTER (UPLOAD FOR TRANSCODE)
// ==============================
const upload = multer({
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: TMP_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

// ==============================
// TRANSCODE (WEBM -> MP4)
// ==============================
app.post("/api/transcode", upload.single("file"), async (req, res) => {
  // Require token (so you can track usage / protect cost)
  const token = getDemoToken(req);
  if (!token) return res.status(401).json({ error: "Missing token" });

  // Ensure token exists + month reset (we DO NOT consume here; frontend already consumed)
  getOrInitUsage(token);

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const inputPath = req.file.path;
  const outputPath = path.join(TMP_DIR, `${nanoid(10)}.mp4`);

  // ffmpeg preset: good quality + low CPU + WhatsApp/IG friendly
  // - baseline profile for max compatibility
  // - faststart for quick playback
  const ffmpegArgs = [
    "-y",
    "-i", inputPath,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-movflags", "+faststart",
    "-pix_fmt", "yuv420p",
    "-profile:v", "baseline",
    "-level", "3.0",
    "-c:a", "aac",
    "-b:a", "128k",
    outputPath,
  ];

  const ff = spawn("ffmpeg", ffmpegArgs);

  // Keep logs minimal (but helpful)
  let lastErr = "";
  ff.stderr.on("data", (d) => {
    const s = String(d);
    lastErr = s.slice(-800);
  });

  ff.on("error", (err) => {
    safeUnlink(inputPath);
    safeUnlink(outputPath);
    return res.status(500).json({ error: "ffmpeg spawn failed", detail: String(err) });
  });

  ff.on("close", (code) => {
    safeUnlink(inputPath);

    if (code !== 0 || !fs.existsSync(outputPath)) {
      safeUnlink(outputPath);
      return res.status(500).json({ error: "Transcode failed", detail: lastErr || `code=${code}` });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "inline; filename=myreplaytv.mp4");

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);

    const cleanup = () => safeUnlink(outputPath);
    stream.on("close", cleanup);
    stream.on("error", cleanup);
    res.on("close", cleanup);
  });
});

// ==============================
// SPA FALLBACK
// ==============================
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==============================
// START
// ==============================
app.listen(PORT, () => {
  console.log("MyRePlayTV running on port", PORT);
});