// server.js — MyRePlayTV (Opção A: FFmpeg backend concat) — CommonJS
// Replit/Railway friendly: require + listen 0.0.0.0 + process.env.PORT

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

// health check (pra testar no preview)
app.get("/health", (req, res) => res.send("ok"));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
});

/** ---------------- Usage (simple monthly token counter) ---------------- */
const DEMO_MAX_EXPORTS = 5;

const usageDir = path.join(os.tmpdir(), "mrp_usage_store");
try { fs.mkdirSync(usageDir, { recursive: true }); } catch {}

function monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function tokenFromReq(req) {
  return String(req.headers["x-mrp-token"] || req.headers["x-demo-token"] || "anon").slice(0, 120);
}
function usageFile(token) {
  const safe = token.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return path.join(usageDir, `${safe}_${monthKey()}.json`);
}
function readUsage(token) {
  const f = usageFile(token);
  try {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    const used = Number(j.used || 0);
    return { used };
  } catch {
    return { used: 0 };
  }
}
function writeUsage(token, used) {
  const f = usageFile(token);
  fs.writeFileSync(f, JSON.stringify({ used }, null, 2), "utf8");
}
function usagePayload(token) {
  const { used } = readUsage(token);
  const max = DEMO_MAX_EXPORTS;
  const left = Math.max(0, max - used);
  return { ok: true, used, max, left };
}

app.get("/api/usage", (req, res) => {
  const token = tokenFromReq(req);
  res.json(usagePayload(token));
});

app.post("/api/usage/consume", (req, res) => {
  const token = tokenFromReq(req);
  const { used } = readUsage(token);
  if (used >= DEMO_MAX_EXPORTS) {
    return res.status(403).json({ ok: false, error: "limit_reached", ...usagePayload(token) });
  }
  writeUsage(token, used + 1);
  res.json(usagePayload(token));
});

/** ---------------- FFmpeg helpers ---------------- */
function run(cmd, args, { timeoutMs = 5 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

    let err = "";
    const t = setTimeout(() => {
      try { p.kill("SIGKILL"); } catch {}
      reject(new Error("FFmpeg timeout"));
    }, timeoutMs);

    p.stderr.on("data", (d) => (err += d.toString()));

    p.on("close", (code) => {
      clearTimeout(t);
      if (code === 0) return resolve();
      reject(new Error(`FFmpeg failed (code ${code})\n${err}`));
    });
  });
}

function tmpFile(ext) {
  const name = "mrp_" + crypto.randomBytes(10).toString("hex") + ext;
  return path.join(os.tmpdir(), name);
}

function writeBufToFile(buf, filepath) {
  fs.writeFileSync(filepath, buf);
  return filepath;
}

function safeNum(x, def) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

function drawWatermarkFilter() {
  // sem depender de fonte externa
  return `drawtext=text='MyRePlayTV':x=w-tw-24:y=24:fontsize=22:fontcolor=white@0.85:box=1:boxcolor=black@0.35:boxborderw=10`;
}

function buildVideoFilter({ zoom = 1.18, vertical = false, watermark = true }) {
  const z = Math.max(1, safeNum(zoom, 1.18));
  const parts = [];

  // zoom estável: scale up + crop centro
  parts.push(`scale=iw*${z}:ih*${z}`);
  parts.push(`crop=iw/${z}:ih/${z}:(in_w-out_w)/2:(in_h-out_h)/2`);

  if (vertical) {
    // 9:16 central 720x1280
    parts.push(`scale=-2:1280`);
    parts.push(`crop=720:1280:(in_w-720)/2:(in_h-1280)/2`);
  } else {
    // garantir dims pares p/ h264
    parts.push(`scale=trunc(iw/2)*2:trunc(ih/2)*2`);
  }

  if (watermark) parts.push(drawWatermarkFilter());
  return parts.join(",");
}

async function renderReplayClip({
  inputMp4,
  outMp4,
  startSec,
  endSec,
  slowRate,
  zoom,
  vertical,
  watermark,
}) {
  const s = Math.max(0, safeNum(startSec, 0));
  const e = Math.max(s + 0.05, safeNum(endSec, s + 1));
  const r = Math.min(1, Math.max(0.25, safeNum(slowRate, 0.55))); // 0.25..1

  const vFilter = buildVideoFilter({ zoom, vertical, watermark });

  // slow: setpts=PTS/slowRate
  const vf = `${vFilter},setpts=PTS/${r}`;
  const af = `atempo=${r}`;

  await run("ffmpeg", [
    "-y",
    "-ss", `${s}`,
    "-to", `${e}`,
    "-i", inputMp4,
    "-vf", vf,
    "-af", af,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "22",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outMp4,
  ], { timeoutMs: 6 * 60 * 1000 });
}

async function concatMp4List({ inputs, outMp4 }) {
  const listFile = tmpFile(".txt");
  const content = inputs.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listFile, content, "utf8");

  try {
    await run("ffmpeg", [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "22",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outMp4,
    ], { timeoutMs: 8 * 60 * 1000 });
  } finally {
    try { fs.unlinkSync(listFile); } catch {}
  }
}

async function addMusic({ inputMp4, musicFile, outMp4 }) {
  await run("ffmpeg", [
    "-y",
    "-i", inputMp4,
    "-i", musicFile,
    "-filter_complex",
    "[1:a]volume=0.25[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]",
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outMp4,
  ], { timeoutMs: 6 * 60 * 1000 });
}

/** ---------------- Generate endpoint ----------------
 * Recebe:
 * - file (original)
 * - music (opcional)
 * - config (JSON string)
 * Retorna MP4
 */
app.post(
  "/api/generate",
  upload.fields([{ name: "file", maxCount: 1 }, { name: "music", maxCount: 1 }]),
  async (req, res) => {
    try {
      const file = req.files?.file?.[0];
      if (!file) return res.status(400).json({ error: "missing_file" });

      let config = {};
      try { config = JSON.parse(String(req.body?.config || "{}")); } catch {}

      const mode = String(config.mode || "full");          // full | replays
      const format = String(config.format || "original");  // original | vertical
      const vertical = format === "vertical";

      const leadIn = safeNum(config.leadIn, 3);
      const afterSec = safeNum(config.afterSec, 2.0);
      const slowRate = safeNum(config.slowRate, 0.55);
      const repeats = Math.max(1, Math.min(3, Math.floor(safeNum(config.repeats, 1))));
      const watermark = config.watermark !== false;
      const zoom = safeNum(config.zoom, 1.18);
      const advance = safeNum(config.advance, 0.08);

      const items = Array.isArray(config.items) ? config.items : [];
      if (!items.length) return res.status(400).json({ error: "need_items" });

      // input temp
      const inMp4 = writeBufToFile(file.buffer, tmpFile(".mp4"));

      const segments = [];

      // Se full, normaliza o original para consistência e concat seguro
      if (mode === "full") {
        const normOriginal = tmpFile(".mp4");
        const vFilter = buildVideoFilter({ zoom: 1.0, vertical, watermark });

        await run("ffmpeg", [
          "-y",
          "-i", inMp4,
          "-vf", vFilter,
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "22",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          normOriginal,
        ], { timeoutMs: 10 * 60 * 1000 });

        segments.push(normOriginal);
      }

      // replays
      const sorted = items
        .map((x) => ({ slowStart: safeNum(x.slowStart, 0), mark: safeNum(x.mark, 0) }))
        .sort((a, b) => a.slowStart - b.slowStart);

      for (const it of sorted) {
        const slowStart = Math.max(0, it.slowStart - Math.max(0, advance));
        const start = Math.max(0, slowStart - Math.max(0, leadIn));
        const end = Math.max(start + 0.2, slowStart + Math.max(0.2, afterSec));

        for (let k = 0; k < repeats; k++) {
          const outClip = tmpFile(".mp4");
          await renderReplayClip({
            inputMp4: inMp4,
            outMp4: outClip,
            startSec: start,
            endSec: end,
            slowRate,
            zoom,
            vertical,
            watermark,
          });
          segments.push(outClip);
        }
      }

      // concat final
      const outMp4 = tmpFile(".mp4");
      await concatMp4List({ inputs: segments, outMp4 });

      // music (optional)
      const music = req.files?.music?.[0];
      let finalMp4 = outMp4;

      if (music) {
        const musicPath = writeBufToFile(
          music.buffer,
          tmpFile(path.extname(music.originalname) || ".mp3")
        );
        const withMusic = tmpFile(".mp4");
        await addMusic({ inputMp4: outMp4, musicFile: musicPath, outMp4: withMusic });
        finalMp4 = withMusic;
        try { fs.unlinkSync(musicPath); } catch {}
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `inline; filename="MyRePlayTV_${Date.now()}.mp4"`);

      const stream = fs.createReadStream(finalMp4);
      stream.pipe(res);

      res.on("close", () => {
        // cleanup best-effort
        const files = [inMp4, outMp4, finalMp4, ...segments].filter(Boolean);
        for (const f of files) {
          try { fs.unlinkSync(f); } catch {}
        }
      });

    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "generate_failed", detail: String(e?.message || e) });
    }
  }
);

// IMPORTANTE no Replit: ouvir em 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log("MyRePlayTV running on:", PORT);
});