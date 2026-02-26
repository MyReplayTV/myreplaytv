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
const MAX_FILE_MB = 200; // pode subir, mas cuidado com custo/tempo
const TMP_DIR = path.join(os.tmpdir(), "myreplaytv");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// In-memory store (demo-friendly, low cost). Reseta quando redeploy/restart.
const usageStore = {}; // token -> { month: "YYYY-MM", used: number }

// ================================
// HELPERS
// ================================
function currentMonthKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

function getTokenFromReq(req) {
  // aceita os 2 formatos (front antigo e novo)
  return (
    req.headers["x-mrp-token"] ||
    req.headers["x-demo-token"] ||
    req.headers["x_mrp_token"] ||
    req.headers["x_demo_token"]
  );
}

function ensureToken(token) {
  if (!token) return null;
  if (!usageStore[token]) usageStore[token] = { month: currentMonthKey(), used: 0 };

  // reset automático por mês
  const mk = currentMonthKey();
  if (usageStore[token].month !== mk) {
    usageStore[token].month = mk;
    usageStore[token].used = 0;
  }
  return usageStore[token];
}

function usagePayload(token) {
  const st = ensureToken(token);
  if (!st) return null;
  const left = Math.max(0, MAX_EXPORTS_PER_MONTH - st.used);
  return { token, limit: MAX_EXPORTS_PER_MONTH, used: st.used, month: st.month, left };
}

// ================================
// STATIC FRONTEND
// ================================
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.status(200).send("ok"));

// ================================
// TOKEN + USAGE API
// ================================
app.get("/api/token", (_req, res) => {
  const token = nanoid(24);
  ensureToken(token);
  res.json(usagePayload(token));
});

app.get("/api/usage", (req, res) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: "Missing token" });

  const payload = usagePayload(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  res.json(payload);
});

app.post("/api/usage/consume", (req, res) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: "Missing token" });

  const st = ensureToken(token);
  if (!st) return res.status(401).json({ error: "Invalid token" });

  if (st.used >= MAX_EXPORTS_PER_MONTH) {
    return res.status(403).json({
      error: "Monthly limit reached",
      ...usagePayload(token),
    });
  }

  st.used += 1;
  res.json(usagePayload(token));
});

// ================================
// MULTER (UPLOAD)
// ================================
const upload = multer({
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: TMP_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

// ================================
// TRANSCODE (WebM -> MP4)
// ================================
app.post("/api/transcode", upload.single("file"), async (req, res) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ error: "Missing token" });

    const st = ensureToken(token);
    if (!st) return res.status(401).json({ error: "Invalid token" });

    // Aqui NÃO consumimos export (o front já consumiu no Generate).
    // Só bloqueia se quiser também impedir MP4 quando acabou.
    if (st.used > MAX_EXPORTS_PER_MONTH) {
      return res.status(403).json({ error: "Monthly limit reached" });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const inputPath = req.file.path;
    const outputPath = path.join(TMP_DIR, `${nanoid(10)}.mp4`);

    // preset bom p/ WhatsApp/IG + compat iPhone
    const ffmpegArgs = [
      "-y",
      "-i", inputPath,

      // vídeo
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-profile:v", "baseline",
      "-level", "3.0",

      // áudio (se tiver)
      "-c:a", "aac",
      "-b:a", "128k",

      outputPath,
    ];

    const ff = spawn("ffmpeg", ffmpegArgs);

    let stderr = "";
    ff.stderr.on("data", (d) => (stderr += d.toString()));

    ff.on("close", (code) => {
      try { fs.unlinkSync(inputPath); } catch {}

      if (code !== 0) {
        try { fs.unlinkSync(outputPath); } catch {}
        console.error("FFmpeg failed:", stderr.slice(-1500));
        return res.status(500).json({ error: "Transcode failed" });
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", "inline; filename=video.mp4");

      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);

      stream.on("close", () => {
        try { fs.unlinkSync(outputPath); } catch {}
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