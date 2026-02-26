const express = require("express");
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const { nanoid } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// CONFIG
// ================================

const MAX_EXPORTS_PER_MONTH = 5;
const MAX_FILE_MB = 120;
const TMP_DIR = path.join(os.tmpdir(), "myreplaytv");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// In-memory token storage (low cost, demo ready)
const usageStore = {}; 
// { token: { month: "2026-02", count: 3 } }

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ================================
// STATIC FRONTEND
// ================================

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// ================================
// TOKEN ROUTE
// ================================

app.get("/api/token", (req, res) => {
  const token = nanoid(24);
  usageStore[token] = {
    month: currentMonthKey(),
    count: 0
  };

  res.json({
    token,
    limit: MAX_EXPORTS_PER_MONTH,
    used: 0
  });
});

// ================================
// MULTER SETUP
// ================================

const upload = multer({
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: TMP_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});

// ================================
// TRANSCODE ROUTE
// ================================

app.post("/api/transcode", upload.single("file"), async (req, res) => {
  try {
    const token = req.headers["x-mrp-token"];
    if (!token || !usageStore[token]) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const monthKey = currentMonthKey();

    // Reset month automatically
    if (usageStore[token].month !== monthKey) {
      usageStore[token].month = monthKey;
      usageStore[token].count = 0;
    }

    if (usageStore[token].count >= MAX_EXPORTS_PER_MONTH) {
      return res.status(403).json({
        error: "Monthly limit reached",
        used: usageStore[token].count,
        limit: MAX_EXPORTS_PER_MONTH
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(TMP_DIR, `${nanoid(10)}.mp4`);

    // FFmpeg preset optimized for quality + low CPU
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
      outputPath
    ];

    const ff = spawn("ffmpeg", ffmpegArgs);

    ff.stderr.on("data", () => {});

    ff.on("close", (code) => {
      if (code !== 0) {
        fs.unlinkSync(inputPath);
        return res.status(500).json({ error: "Transcode failed" });
      }

      usageStore[token].count++;

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", "inline; filename=video.mp4");

      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);

      stream.on("close", () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================================
// SPA FALLBACK
// ================================

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================================
// START
// ================================

app.listen(PORT, () => {
  console.log("MyRePlayTV running on port", PORT);
});