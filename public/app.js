// MyRePlayTV — app.js (refeito e encapsulado, sem conflitos)
// Regra: tudo dentro de IIFE, e toda referência DOM é opcional (não quebra).

// iOS Safari: evita ruído de AbortError quebrando UX.
window.addEventListener("unhandledrejection", (e) => {
  const reason = String(e?.reason?.name || e?.reason || "");
  if (reason.includes("AbortError")) e.preventDefault();
});

(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const lerp = (a, b, t) => a + (b - a) * t;

  function safe(fn) { try { return fn(); } catch { return undefined; } }

  // ---------- DOM ----------
  const player = $("player");
  const status = $("status");

  const btnCam = $("btnCam");
  const btnUpload = $("btnUpload");
  const fileInput = $("fileInput");

  const btnGenerate = $("btnGenerate");
  const btnMark = $("btnMark");
  const btnClear = $("btnClear");
  const btnDelete = $("btnDelete");

  const leadBtn = $("leadBtn");
  const repBtn = $("repBtn");

  const musicBtn = $("musicBtn");
  const musicInput = $("musicInput");

  const modeSel = $("modeSel");
  const formatSel = $("formatSel");

  const btnPreviewOriginal = $("btnPreviewOriginal");
  const btnPreviewGenerated = $("btnPreviewGenerated");

  const btnShareOriginal = $("btnShareOriginal");
  const btnShareGenerated = $("btnShareGenerated");

  const marksList = $("marksList");

  const langSel = $("langSel");
  const tagline = $("tagline");
  const marksTitle = $("marksTitle");
  const hintText = $("hintText");
  const usageLine = $("usageLine");

  const lockOverlay = $("lockOverlay");
  const lockTitle = $("lockTitle");
  const lockSub = $("lockSub");
  const recBtn = $("recBtn");

  // modal
  const modalBg = $("modalBg");
  const mTitle = $("mTitle");
  const mBody = $("mBody");
  const mOk = $("mOk");

  // ---------- Modal ----------
  const showModal = (t, b) => {
    if (!modalBg || !mTitle || !mBody) {
      alert(`${t}\n\n${b}`);
      return;
    }
    mTitle.textContent = String(t || "MyRePlayTV");
    mBody.textContent = String(b || "");
    modalBg.style.display = "flex";
  };
  const hideModal = () => { if (modalBg) modalBg.style.display = "none"; };

  if (mOk) mOk.onclick = hideModal;
  if (modalBg) modalBg.addEventListener("click", (e) => { if (e.target === modalBg) hideModal(); });

  // ---------- iOS inline video safety ----------
  function forceInlineVideo() {
    if (!player) return;
    player.playsInline = true;
    player.setAttribute("playsinline", "");
    player.setAttribute("webkit-playsinline", "");
    player.setAttribute("disablepictureinpicture", "");
    player.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
  }
  function forceAudioOnForPreview() {
    if (!player) return;
    player.muted = false;
    player.defaultMuted = false;
    player.volume = 1;
    player.removeAttribute("muted");
  }
  forceInlineVideo();
  // ---------- Language ----------
  const STR = {
    en: {
      tagline: "TV-style replays in seconds",
      Marks: "Marks",
      Hint: "Tip: Play the video, tap ⭐ Mark right after the moment. The app auto-syncs the motion peak.",
      Ready: "Ready. Import or Camera.",
      Loaded: "Loaded. Play ▶ then ⭐ Mark. Generate anytime.",
      Marked: "Marked. Add more or Generate.",
      Cleared: "Marks cleared.",
      Gen: "Generating…",
      BusyS: "Do not touch the video while processing",
      NoVideo: "Load a video first.",
      NeedMark: "Mark at least 1 replay (⭐).",
      TooLong: "Max 2 minutes for demo. Trim the video and try again.",
      Done: "Done. Preview: Generated.",
      SharePreparing: "Preparing share…",
      ShareFail: "Sharing not available. Use a different app or save first.",
      ExportError: "Export error",
      Usage: (left, max) => `Free demo: ${left}/${max} exports left this month`,
      UsageUnknown: "Free demo: usage counter loading…",
      UsageBlocked: "Free demo limit reached for this month.",
      UpgradeTitle: "Premium Demo",
      UpgradeBody: "This is a premium demo build. Free users get a limited number of exports per month.",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Music: On",
      MusicOff: "♪ Music: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Replays only",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
    },
    pt: {
      tagline: "Replays estilo TV em segundos",
      Marks: "Marcas",
      Hint: "Dica: Reproduza o vídeo e toque ⭐ Mark logo após o momento. O app sincroniza o pico do movimento.",
      Ready: "Pronto. Importar ou Câmera.",
      Loaded: "Carregado. Play ▶ e depois ⭐ Mark. Gere quando quiser.",
      Marked: "Marcado. Adicione mais ou Gerar.",
      Cleared: "Marcas limpas.",
      Gen: "Gerando…",
      BusyS: "Não toque no vídeo enquanto estiver gerando",
      NoVideo: "Carregue um vídeo primeiro.",
      NeedMark: "Marque pelo menos 1 replay (⭐).",
      TooLong: "Máx 2 minutos na demo. Corte o vídeo e tente de novo.",
      Done: "Pronto. Prévia: Gerado.",
      SharePreparing: "Preparando envio…",
      ShareFail: "Compartilhar não disponível. Use outro app ou salve antes.",
      ExportError: "Erro ao exportar",
      Usage: (left, max) => `Demo grátis: ${left}/${max} exports restantes este mês`,
      UsageUnknown: "Demo grátis: carregando contador…",
      UsageBlocked: "Limite mensal da demo atingido.",
      UpgradeTitle: "Demo Premium",
      UpgradeBody: "Este é um build demo premium. Usuários free têm um limite de exports por mês.",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Música: On",
      MusicOff: "♪ Música: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Só Replays",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
    },
    el: { /* mantém inglês se faltar */ },
    es: { /* mantém inglês se faltar */ },
    it: { /* mantém inglês se faltar */ },
  };

  let lang = (langSel?.value || "en");
  function tr() { return STR[lang] || STR.en; }

  function applyLang() {
    const T = tr();
    if (tagline) tagline.textContent = T.tagline;
    if (marksTitle) marksTitle.textContent = T.Marks;
    if (hintText) hintText.textContent = T.Hint;

    if (modeSel) {
      const o1 = modeSel.querySelector('option[value="full"]');
      const o2 = modeSel.querySelector('option[value="replays"]');
      if (o1) o1.textContent = T.ModeFull || STR.en.ModeFull;
      if (o2) o2.textContent = T.ModeReplays || STR.en.ModeReplays;
    }
    if (formatSel) {
      const o1 = formatSel.querySelector('option[value="original"]');
      const o2 = formatSel.querySelector('option[value="vertical"]');
      if (o1) o1.textContent = T.FormatOriginal || STR.en.FormatOriginal;
      if (o2) o2.textContent = T.FormatVertical || STR.en.FormatVertical;
    }

    // badges
    updateBadges();

    // usage line text
    refreshUsageUI();
  }

  if (langSel) {
    langSel.onchange = () => {
      lang = langSel.value || "en";
      applyLang();
    };
  }
  // ---------- State ----------
  let marks = [];
  let leadIn = 3;   // 1..10
  let repeats = 1;  // 1..3

  const MAX_SECONDS = 120;

  // Replay feel
  const AFTER_SEC = 2.0;
  const SLOW_RATE = 0.55;

  // Auto-sync peak (motion)
  const PEAK_LOOKBACK = 0.70;
  const PEAK_LOOKAHEAD = 0.12;
  const PEAK_STEP = 0.08;
  const PEAK_LEAD = 0.14;

  // Cinema tuning
  const ZOOM_MAX = 1.22;
  const ZOOM_EASE_MS = 320;
  const FADE_MS = 120;
  const ADVANCE = 0.08;
  const REC_WARMUP_MS = 420;

  // Export quality
  const REC_TIMESLICE = 500;
  const FPS_HINT = 24;

  // URLs / blobs
  let originalUrl = null;
  let originalBlob = null;

  let generatedBlob = null;
  let generatedUrl = null;
  let generatedMime = "video/webm";

  // Music
  let musicUrl = null;
  const musicEl = new Audio();
  musicEl.loop = true;
  musicEl.preload = "auto";

  // Separate audio element for export (Safari)
  const exportAudioEl = new Audio();
  exportAudioEl.preload = "auto";
  exportAudioEl.crossOrigin = "anonymous";

  // Camera
  let camStream = null;
  let camRecorder = null;
  let camChunks = [];
  let cameraOn = false;

  // Real camera zoom (when supported)
  let camZoom = 1.0;
  let camZoomMin = 1.0;
  let camZoomMax = 1.0;
  let camZoomSupported = false;

  function setStatus(t) {
    if (status) status.textContent = String(t || "");
  }

  // ---------- Demo usage counter ----------
  const DEMO_MAX_EXPORTS = 5;
  const TOKEN_KEY = "mrp_demo_token_v1";

  function getToken() {
    let t = localStorage.getItem(TOKEN_KEY);
    if (t) return t;
    t = "mrp_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
    localStorage.setItem(TOKEN_KEY, t);
    return t;
  }
  const DEMO_TOKEN = getToken();

  let usage = { ok: true, max: DEMO_MAX_EXPORTS, used: 0, left: DEMO_MAX_EXPORTS };
  let usageLoaded = false;

  async function apiJSON(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    headers["x-demo-token"] = DEMO_TOKEN;
    headers["x-mrp-token"] = DEMO_TOKEN;
    const r = await fetch(url, { ...opts, headers });
    let data = null;
    try { data = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data };
  }

  async function fetchUsage() {
    const res = await apiJSON("/api/usage");
    if (res.ok && res.data) {
      const max = Number(res.data.max ?? res.data.limit ?? DEMO_MAX_EXPORTS);
      const used = Number(res.data.used ?? 0);
      const left = Number(res.data.left ?? Math.max(0, max - used));
      usage = { ok: true, max, used, left };
      usageLoaded = true;
      return;
    }
    // fallback local
    const key = "mrp_local_usage_" + new Date().toISOString().slice(0, 7);
    const used = Number(localStorage.getItem(key) || "0");
    usage = { ok: true, max: DEMO_MAX_EXPORTS, used, left: Math.max(0, DEMO_MAX_EXPORTS - used) };
    usageLoaded = true;
  }

  async function consumeOneExport() {
    const res = await apiJSON("/api/usage/consume", { method: "POST" });
    if (res.ok && res.data) {
      const max = Number(res.data.max ?? res.data.limit ?? DEMO_MAX_EXPORTS);
      const used = Number(res.data.used ?? 0);
      const left = Number(res.data.left ?? Math.max(0, max - used));
      usage = { ok: true, max, used, left };
      usageLoaded = true;
      return true;
    }
    // fallback local consume
    const key = "mrp_local_usage_" + new Date().toISOString().slice(0, 7);
    const used = Number(localStorage.getItem(key) || "0");
    if (used >= DEMO_MAX_EXPORTS) return false;
    localStorage.setItem(key, String(used + 1));
    usage = { ok: true, max: DEMO_MAX_EXPORTS, used: used + 1, left: Math.max(0, DEMO_MAX_EXPORTS - (used + 1)) };
    usageLoaded = true;
    return true;
  }

  function refreshUsageUI() {
    if (!usageLine) return;
    const T = tr();
    if (!usageLoaded) {
      usageLine.textContent = T.UsageUnknown || STR.en.UsageUnknown;
      return;
    }
    const left = Number(usage.left ?? 0);
    const max = Number(usage.max ?? DEMO_MAX_EXPORTS);
    usageLine.textContent = (T.Usage || STR.en.Usage)(left, max);
    usageLine.style.opacity = left <= 1 ? "0.95" : "0.86";
  }

  function isUsageBlocked() {
    return usageLoaded && Number(usage.left ?? 0) <= 0;
  }
  // ---------- LOCK (corrigido, sem erro de sintaxe) ----------
  function setLocked(on) {
    if (lockOverlay) lockOverlay.style.display = on ? "flex" : "none";
    if (lockTitle) lockTitle.textContent = tr().Gen || STR.en.Gen;
    if (lockSub) lockSub.textContent = tr().BusyS || STR.en.BusyS;

    const allBtns = [
      btnCam, btnUpload,
      btnGenerate, btnMark, btnClear, btnDelete,
      leadBtn, repBtn, musicBtn,
      modeSel, formatSel,
      btnPreviewOriginal, btnPreviewGenerated,
      btnShareOriginal, btnShareGenerated,
      langSel
    ].filter(Boolean);

    allBtns.forEach((b) => { b.disabled = !!on; });

    window.__MRP_LOCKED__ = !!on;

    if (player) {
      player.controls = !on; // durante lock, tira controls pra não travar iOS
      player.style.pointerEvents = on ? "none" : "auto";
      forceInlineVideo();
    }
  }

  function blockIfLocked(e) {
    if (!window.__MRP_LOCKED__) return;
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  ["touchstart","touchmove","touchend","pointerdown","pointerup","click","dblclick","keydown","wheel"]
    .forEach((evt) => window.addEventListener(evt, blockIfLocked, { capture: true, passive: false }));

  function enableControls(yes) {
    const y = !!yes;
    if (btnGenerate) btnGenerate.disabled = !y;
    if (btnMark) btnMark.disabled = !y;
    if (btnClear) btnClear.disabled = !y;
    if (btnDelete) btnDelete.disabled = !y;

    if (modeSel) modeSel.disabled = !y;
    if (formatSel) formatSel.disabled = !y;

    if (btnPreviewOriginal) btnPreviewOriginal.disabled = !y;

    // Share original só precisa de original carregado
    if (btnShareOriginal) btnShareOriginal.disabled = !y;

    // Generated começa off até existir arquivo gerado
    if (btnPreviewGenerated) btnPreviewGenerated.disabled = !(generatedUrl && y);
    if (btnShareGenerated) btnShareGenerated.disabled = !(generatedBlob && y);
  }

  function clearGenerated() {
    if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    generatedUrl = null;
    generatedBlob = null;
    generatedMime = "video/webm";
    if (btnPreviewGenerated) btnPreviewGenerated.disabled = true;
    if (btnShareGenerated) btnShareGenerated.disabled = true;
  }

  function updateBadges() {
    const T = tr();
    if (leadBtn) leadBtn.textContent = (T.BtnLead || STR.en.BtnLead)(leadIn);
    if (repBtn) repBtn.textContent = (T.BtnRep || STR.en.BtnRep)(repeats);
    if (musicBtn) musicBtn.textContent = musicUrl ? (T.MusicOn || STR.en.MusicOn) : (T.MusicOff || STR.en.MusicOff);
  }

  // ---------- UI actions ----------
  if (leadBtn) leadBtn.onclick = () => {
    const n = prompt("Replay lead-in seconds (1–10):", String(leadIn));
    if (!n) return;
    const v = parseInt(n, 10);
    if (v >= 1 && v <= 10) { leadIn = v; updateBadges(); }
  };

  if (repBtn) repBtn.onclick = () => {
    const n = prompt("Replays (1–3):", String(repeats));
    if (!n) return;
    const v = parseInt(n, 10);
    if (v >= 1 && v <= 3) { repeats = v; updateBadges(); }
  };

  if (musicBtn) musicBtn.onclick = () => {
    const ok = confirm(
      "Optional music for replays.\n\n" +
      "You must own rights or have permission.\n" +
      "OK = pick file\nCancel = turn off"
    );
    if (!ok) {
      if (musicUrl) URL.revokeObjectURL(musicUrl);
      musicUrl = null;
      safe(() => musicEl.pause());
      musicEl.src = "";
      updateBadges();
      return;
    }
    if (musicInput) musicInput.click();
  };

  if (musicInput) musicInput.onchange = () => {
    const f = musicInput.files?.[0];
    if (!f) return;
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    musicUrl = URL.createObjectURL(f);
    musicEl.src = musicUrl;
    updateBadges();
  };
  // ---------- Camera motor (mantido) ----------
  function stopCamera() {
    if (!cameraOn) return;

    if (camRecorder) { try { camRecorder.stop(); } catch {} }
    camRecorder = null;
    camChunks = [];

    if (camStream) camStream.getTracks().forEach((t) => t.stop());
    camStream = null;

    cameraOn = false;
    camZoom = 1.0;
    camZoomSupported = false;

    if (recBtn) recBtn.style.display = "none";
    forceInlineVideo();
  }

  function setOriginalFromBlob(blob) {
    stopCamera();
    clearGenerated();

    originalBlob = blob;
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    originalUrl = URL.createObjectURL(blob);

    safe(() => player.pause());
    if (player) {
      player.srcObject = null;
      player.playbackRate = 1;
      player.src = originalUrl;
      player.controls = true;
      player.load();
    }
    forceAudioOnForPreview();
    forceInlineVideo();

    safe(() => { exportAudioEl.pause(); });
    exportAudioEl.src = originalUrl;
    safe(() => exportAudioEl.load());

    enableControls(true);
    setStatus(tr().Loaded || STR.en.Loaded);
  }

  // Import
  if (btnUpload) btnUpload.onclick = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!fileInput) return false;
    try { btnUpload.type = "button"; } catch {}
    fileInput.value = "";
    fileInput.click();
    return false;
  };

  if (fileInput) fileInput.onchange = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const f = fileInput.files?.[0];
    if (!f) return;
    setOriginalFromBlob(f);
  };

  async function startCamera() {
    if (cameraOn) return;
    try {
      forceInlineVideo();

      camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });

      cameraOn = true;
      camZoom = 1.0;
      camZoomSupported = false;

      if (player) {
        player.src = "";
        player.srcObject = camStream;
        player.controls = false;
        player.muted = true;
        forceInlineVideo();
      }

      // try real zoom support
      const vTrack = camStream.getVideoTracks?.()[0];
      if (vTrack && vTrack.getCapabilities) {
        const caps = vTrack.getCapabilities();
        if (caps && typeof caps.zoom !== "undefined") {
          camZoomSupported = true;
          camZoomMin = caps.zoom.min ?? 1;
          camZoomMax = caps.zoom.max ?? 1;
          camZoom = clamp(1.0, camZoomMin, camZoomMax);
          try { await vTrack.applyConstraints({ advanced: [{ zoom: camZoom }] }); } catch {}
        }
      }

      await safe(() => player.play());

      if (recBtn) {
        recBtn.style.display = "block";
        recBtn.textContent = "● REC";
      }
      setStatus("Camera ready. Pinch to zoom, then ● REC.");
    } catch (e) {
      console.error(e);
      showModal("Camera blocked", tr().CamBlocked || "Allow camera + microphone permissions.");
    }
  }

  if (btnCam) btnCam.onclick = () => (cameraOn ? stopCamera() : startCamera());

  // Pinch zoom (real track when supported)
  (function enableCameraPinchZoom() {
    const wrap = $("videoWrap") || $("videoWrap") || $("videoWrap");
    const host = $("videoWrap") || $("videoWrap") || document.getElementById("videoWrap") || document.getElementById("videoWrap");
    const container = document.getElementById("videoWrap") || document.getElementById("videoWrap") || document.getElementById("videoWrap");
    const w = document.getElementById("videoWrap") || document.getElementById("videoWrap") || document.getElementById("videoWrap");
    const videoWrap = document.getElementById("videoWrap") || document.getElementById("videoWrap") || (player ? player.parentElement : null);
    if (!player || !videoWrap) return;

    let baseZoom = 1.0;
    let pinchDist0 = 0;
    let pinching = false;

    const dist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    function cameraActive() {
      return cameraOn && !!camStream && !!player.srcObject;
    }

    async function applyZoom(z) {
      camZoom = z;
      if (!cameraActive()) return;

      const vTrack = camStream?.getVideoTracks?.()[0];
      if (camZoomSupported && vTrack) {
        camZoom = clamp(camZoom, camZoomMin, camZoomMax);
        try {
          await vTrack.applyConstraints({ advanced: [{ zoom: camZoom }] });
          player.style.transform = "none";
          return;
        } catch {
          // fallback visual below
        }
      }

      camZoom = clamp(camZoom, 1, 4);
      player.style.transformOrigin = "center center";
      player.style.transform = `scale(${camZoom})`;
    }

    // Double tap reset
    let lastTap = 0;
    videoWrap.addEventListener("touchend", async (e) => {
      if (!cameraActive()) return;
      const now = Date.now();
      if (now - lastTap < 280) {
        await applyZoom(1.0);
        e.preventDefault(); e.stopPropagation();
      }
      lastTap = now;
    }, { passive: false });

    videoWrap.addEventListener("touchstart", (e) => {
      if (!cameraActive()) return;
      if (e.touches.length === 2) {
        pinching = true;
        baseZoom = camZoom;
        pinchDist0 = dist(e.touches[0], e.touches[1]);
        e.preventDefault(); e.stopPropagation();
      }
    }, { passive: false });

    videoWrap.addEventListener("touchmove", async (e) => {
      if (!cameraActive()) return;
      if (pinching && e.touches.length === 2) {
        const d = dist(e.touches[0], e.touches[1]);
        const ratio = d / (pinchDist0 || d);
        await applyZoom(baseZoom * ratio);
        e.preventDefault(); e.stopPropagation();
      }
    }, { passive: false });

    videoWrap.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) pinching = false;
    }, { passive: true });

    // patch stopCamera to reset transform
    const _stop = stopCamera;
    stopCamera = function () {
      _stop();
      try { player.style.transform = "none"; } catch {}
      camZoom = 1.0;
    };
  })();

  // REC button
  if (recBtn) recBtn.onclick = () => {
    if (!cameraOn || !camStream) return;

    if (!camRecorder) {
      camChunks = [];
      let mime = "video/webm;codecs=vp8,opus";
      try { camRecorder = new MediaRecorder(camStream, { mimeType: mime }); }
      catch { mime = "video/webm"; camRecorder = new MediaRecorder(camStream); }

      camRecorder.ondataavailable = (e) => { if (e.data && e.data.size) camChunks.push(e.data); };
      camRecorder.onstop = () => {
        const blob = new Blob(camChunks, { type: mime });
        setOriginalFromBlob(blob);
      };

      camRecorder.start(250);
      recBtn.textContent = "■ STOP";
      setStatus("Recording… press ■ STOP.");
      return;
    }

    try { camRecorder.stop(); } catch {}
    camRecorder = null;
  };
  // ---------- Marks UI ----------
  function renderMarks() {
    if (!marksList) return;
    marksList.innerHTML = "";

    const sorted = marks.slice().sort((a, b) => a - b);
    sorted.forEach((t, idx) => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div><b>⭐ Mark</b><div class="meta">${t.toFixed(2)}s</div></div>
        <div style="display:flex;gap:8px;align-items:center">
          <button type="button" class="smallBtn" data-go="${t}">Go</button>
          <button type="button" class="smallBtn danger" data-del="${idx}">Delete</button>
        </div>
      `;
      marksList.appendChild(row);
    });

    marksList.querySelectorAll("[data-go]").forEach((b) => {
      b.onclick = () => {
        const t = Number(b.getAttribute("data-go"));
        if (!player) return;
        player.currentTime = clamp(t - 0.2, 0, player.duration || 1e9);
        forceAudioOnForPreview();
        player.play().catch(() => {});
      };
    });

    marksList.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        const idx = Number(b.getAttribute("data-del"));
        const sortedMarks = marks.slice().sort((a, b) => a - b);
        const value = sortedMarks[idx];
        let removed = false;
        marks = marks.filter((x) => {
          if (!removed && x === value) { removed = true; return false; }
          return true;
        });
        renderMarks();
      };
    });
  }

  if (btnMark) btnMark.onclick = () => {
    if (!player || !player.duration) return showModal("MyRePlayTV", tr().NoVideo || STR.en.NoVideo);
    marks.push(Number(player.currentTime || 0));
    renderMarks();
    setStatus(tr().Marked || STR.en.Marked);
  };

  if (btnClear) btnClear.onclick = () => {
    marks = [];
    renderMarks();
    setStatus(tr().Cleared || STR.en.Cleared);
  };

  if (btnDelete) btnDelete.onclick = () => {
    marks = [];
    renderMarks();
    clearGenerated();

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    originalUrl = null;
    originalBlob = null;

    safe(() => { exportAudioEl.pause(); exportAudioEl.src = ""; });
    safe(() => { player.pause(); });

    if (player) {
      player.srcObject = null;
      player.src = "";
      player.controls = false;
    }

    enableControls(false);
    forceInlineVideo();
    setStatus(tr().Ready || STR.en.Ready);
  };

  // Preview original
  if (btnPreviewOriginal) btnPreviewOriginal.onclick = () => {
    if (!player || !originalUrl) return;
    safe(() => player.pause());
    player.srcObject = null;
    player.playbackRate = 1;
    player.src = originalUrl;
    player.controls = true;
    player.load();
    forceAudioOnForPreview();
    forceInlineVideo();
    player.play().catch(() => {});
  };

  // Preview generated
  if (btnPreviewGenerated) btnPreviewGenerated.onclick = () => {
    if (!player || !generatedUrl) return;
    safe(() => player.pause());
    player.srcObject = null;
    player.playbackRate = 1;
    player.src = generatedUrl;
    player.controls = true;
    player.load();
    forceAudioOnForPreview();
    forceInlineVideo();
    player.play().catch(() => {});
  };
  // ---------- Motion peak search (motor mantido) ----------
  const tmp = document.createElement("canvas");
  const tctx = tmp.getContext("2d", { willReadFrequently: true });

  function frameSig() {
    if (!player) return null;
    const vw = player.videoWidth || 0, vh = player.videoHeight || 0;
    if (!vw || !vh) return null;

    const W = 120;
    const H = Math.max(70, Math.round((vh / vw) * W));
    tmp.width = W; tmp.height = H;

    tctx.drawImage(player, 0, 0, W, H);
    const d = tctx.getImageData(0, 0, W, H).data;

    const sig = new Uint8Array(W * H);
    for (let i = 0, p = 0; i < sig.length; i++, p += 4) {
      sig[i] = (d[p] * 0.3 + d[p + 1] * 0.59 + d[p + 2] * 0.11) | 0;
    }
    return sig;
  }

  function diffScore(a, b) {
    if (!a || !b) return 0;
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s;
  }

  async function waitSeek() {
    if (!player) return;
    return new Promise((res) => {
      const on = () => { player.removeEventListener("seeked", on); res(); };
      player.addEventListener("seeked", on, { once: true });
    });
  }

  async function findPeak(markT) {
    if (!player) return markT;
    const dur = player.duration || 0;
    const start = clamp(markT - PEAK_LOOKBACK, 0, dur);
    const end = clamp(markT + PEAK_LOOKAHEAD, 0, dur);

    safe(() => player.pause());

    let bestT = markT;
    let best = -1;
    let prev = null;

    for (let t = start; t <= end + 1e-6; t += PEAK_STEP) {
      player.currentTime = t;
      await waitSeek();
      await sleep(8);

      const cur = frameSig();
      const score = prev ? diffScore(prev, cur) : 0;
      prev = cur;

      if (score > best) { best = score; bestT = t; }
    }
    return clamp(bestT - PEAK_LEAD, 0, dur);
  }

  // ---------- Export drawing / watermark ----------
  function drawWatermark(ctx, w) {
    const text = "MyRePlayTV";
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.font = `900 ${Math.max(18, Math.round(w * 0.030))}px system-ui,-apple-system,Segoe UI,Roboto,Arial`;
    const pad = Math.max(12, Math.round(w * 0.02));
    const x = pad, y = pad;
    const m = ctx.measureText(text);
    const boxW = m.width + pad * 1.3;
    const boxH = Math.max(32, Math.round(w * 0.055));
    ctx.fillStyle = "rgba(0,0,0,.30)";
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, boxW, boxH, 999);
    else {
      // fallback
      ctx.rect(x, y, boxW, boxH);
    }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.90)";
    ctx.fillText(text, x + pad * 0.65, y + boxH * 0.70);
    ctx.restore();
  }

  function computeCanvasSize(vw, vh, format) {
    if (format === "vertical") return { cw: 1080, ch: 1920 };
    const isLandscape = (vw || 1280) >= (vh || 720);
    if (isLandscape) return { cw: 1920, ch: 1080 };
    return { cw: 1080, ch: 1920 };
  }

  function drawFrame(ctx, canvasW, canvasH, zoomMode) {
    if (!player) return;
    const vw = player.videoWidth || canvasW;
    const vh = player.videoHeight || canvasH;
    const format = (formatSel?.value || "original");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (format === "vertical") {
      const targetAR = canvasW / canvasH;
      const srcAR = vw / vh;

      let srcW, srcH;
      if (srcAR > targetAR) { srcH = vh; srcW = vh * targetAR; }
      else { srcW = vw; srcH = vw / targetAR; }

      let sx = (vw - srcW) / 2;
      let sy = (vh - srcH) / 2;

      if (zoomMode) {
        const z = zoomMode;
        const zW = srcW / z;
        const zH = srcH / z;
        sx = clamp((vw - zW) / 2, 0, vw - zW);
        sy = clamp((vh - zH) / 2, 0, vh - zH);
        srcW = zW; srcH = zH;
      }

      ctx.drawImage(player, sx, sy, srcW, srcH, 0, 0, canvasW, canvasH);
      return;
    }

    if (zoomMode) {
      const scale = zoomMode;
      const srcW = vw / scale;
      const srcH = vh / scale;
      const sx = clamp((vw - srcW) / 2, 0, vw - srcW);
      const sy = clamp((vh - srcH) / 2, 0, vh - srcH);
      ctx.drawImage(player, sx, sy, srcW, srcH, 0, 0, canvasW, canvasH);
    } else {
      ctx.drawImage(player, 0, 0, canvasW, canvasH);
    }
  } 
  function makeExporter(canvas, ctx) {
    let fx = { mode: "normal", zoom: 1.0, targetZoom: 1.0, fade: 0 };
    let running = true;

    function draw() {
      fx.zoom = fx.zoom + (fx.targetZoom - fx.zoom) * 0.075;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (fx.mode === "replay") drawFrame(ctx, canvas.width, canvas.height, fx.zoom);
      else drawFrame(ctx, canvas.width, canvas.height, 0);

      drawWatermark(ctx, canvas.width);

      if (fx.fade > 0) {
        ctx.save();
        ctx.globalAlpha = fx.fade;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    const rvfc = player?.requestVideoFrameCallback?.bind(player);
    if (rvfc) {
      const loop = () => { if (!running) return; draw(); rvfc(loop); };
      rvfc(loop);
    } else {
      const loop = () => { if (!running) return; draw(); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    return {
      normal() { fx.mode = "normal"; fx.targetZoom = 1.0; },
      replay() { fx.mode = "replay"; fx.targetZoom = ZOOM_MAX; },
      zoomOut() { fx.targetZoom = 1.0; },
      setFade(a) { fx.fade = clamp(a, 0, 1); },
      stop() { running = false; }
    };
  }

  async function fade(exporter, fromA, toA, ms) {
    const t0 = performance.now();
    const dur = Math.max(80, ms | 0);
    while (true) {
      const t = (performance.now() - t0) / dur;
      exporter.setFade(lerp(fromA, toA, clamp(t, 0, 1)));
      if (t >= 1) break;
      await sleep(16);
    }
  }

  async function waitNear(t) {
    if (!player) return;
    const start = performance.now();
    while (Math.abs((player.currentTime || 0) - t) > 0.18) {
      if (performance.now() - start > 7000) break;
      await sleep(60);
    }
  }

  async function waitUntilTime(target) {
    if (!player) return;
    target = clamp(target, 0, player.duration || 1e9);
    return new Promise((resolve) => {
      const poll = () => {
        if ((player.currentTime || 0) >= target) return resolve();
        setTimeout(poll, 16);
      };
      poll();
    });
  }

  async function playTo(end) {
    if (!player) return;
    end = clamp(end, 0, player.duration);
    player.playbackRate = 1;
    await player.play().catch(() => {});
    return new Promise((resolve) => {
      const onTime = () => {
        if ((player.currentTime || 0) >= end - 0.03) {
          player.pause();
          player.removeEventListener("timeupdate", onTime);
          resolve();
        }
      };
      player.addEventListener("timeupdate", onTime);
    });
  }

  async function startExportAudioAt(t) {
    try {
      exportAudioEl.pause();
      exportAudioEl.currentTime = clamp(t, 0, exportAudioEl.duration || 1e9);
      exportAudioEl.muted = false;
      exportAudioEl.volume = 1;
      await exportAudioEl.play();
    } catch {}
  }
  function stopExportAudio() { try { exportAudioEl.pause(); } catch {} }

  async function pickRecorder(stream) {
    const tries = [
      { mime: "video/mp4;codecs=h264,aac" },
      { mime: "video/mp4" },
      { mime: "video/webm;codecs=vp9,opus" },
      { mime: "video/webm;codecs=vp8,opus" },
    ];
    for (const t of tries) {
      try {
        if (t.mime && MediaRecorder.isTypeSupported?.(t.mime)) {
          return {
            rec: new MediaRecorder(stream, { mimeType: t.mime }),
            mime: t.mime
          };
        }
      } catch {}
    }
    return { rec: new MediaRecorder(stream), mime: "video/webm" };
  }

  // ---------- CORE: generateTV ----------
  async function generateTV(mode) {
    if (!player) throw new Error("No player.");
    const vw = player.videoWidth || 1280;
    const vh = player.videoHeight || 720;

    const format = (formatSel?.value || "original");
    const { cw, ch } = computeCanvasSize(vw, vh, format);

    if ((player.duration || 0) > MAX_SECONDS + 0.5) {
      throw new Error(tr().TooLong || STR.en.TooLong);
    }

    setStatus("Auto-syncing marks…");
    const sorted = marks.slice().sort((a, b) => a - b);
    const savedT = player.currentTime || 0;

    const synced = [];
    for (const m of sorted) {
      const slowStart = await findPeak(m);
      synced.push({ mark: m, slowStart });
    }

    player.currentTime = clamp(savedT, 0, player.duration);
    await waitSeek();

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { alpha: false });

    const stream = canvas.captureStream(FPS_HINT);

    // audio mix
    let ac = null, dest = null, gainOrig = null, gainMusic = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      dest = ac.createMediaStreamDestination();

      const srcOrig = ac.createMediaElementSource(exportAudioEl);
      gainOrig = ac.createGain(); gainOrig.gain.value = 1.0;
      srcOrig.connect(gainOrig).connect(dest);

      if (musicUrl) {
        const srcMusic = ac.createMediaElementSource(musicEl);
        gainMusic = ac.createGain(); gainMusic.gain.value = 0.0;
        srcMusic.connect(gainMusic).connect(dest);
      }

      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch (e) {
      console.warn("Audio mix not available:", e);
    }

    const { rec, mime } = await pickRecorder(stream);
    generatedMime = mime;

    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.start(REC_TIMESLICE);

    const exporter = makeExporter(canvas, ctx);

    player.muted = true;

    // warmup
    player.playbackRate = 1;
    await player.play().catch(() => {});
    await sleep(REC_WARMUP_MS);
    player.pause();

    const ramp = (gainNode, to) => {
      if (!gainNode || !ac) return;
      const now = ac.currentTime;
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(to, now + 0.05);
      } catch {}
    };

    const audioNormal = async (t) => {
      ramp(gainOrig, 1.0);
      ramp(gainMusic, 0.0);
      safe(() => musicEl.pause());
      stopExportAudio();
      if (typeof t === "number") await startExportAudioAt(t);
    };

    const audioReplay = () => {
      ramp(gainOrig, 0.0);
      stopExportAudio();
      if (musicUrl && gainMusic && ac) {
        try { musicEl.currentTime = 0; musicEl.play().catch(() => {}); } catch {}
        ramp(gainMusic, 0.8);
      } else {
        ramp(gainMusic, 0.0);
        safe(() => musicEl.pause());
      }
    };

    // record original
    if (mode !== "replays") {
      setStatus("Recording original…");
      exporter.normal(); exporter.setFade(0);

      const START = Math.min(0.25, Math.max(0, (player.duration || 0) - 0.3));
      player.playbackRate = 1;
      player.currentTime = START;
      await waitNear(START);
      await audioNormal(START);

      await playTo(player.duration);
      stopExportAudio();
    }
    // record replays
    setStatus("Recording replays…");
    for (const it of synced) {
      const slowStart = it.slowStart;
      const clipStart = clamp(slowStart - leadIn, 0, player.duration);
      const clipEnd = clamp(slowStart + AFTER_SEC, 0, player.duration);

      for (let r = 0; r < repeats; r++) {
        await fade(exporter, 0, 1, FADE_MS);
        await fade(exporter, 1, 0, FADE_MS);

        player.currentTime = clipStart;
        await waitNear(clipStart);

        exporter.replay();
        await sleep(ZOOM_EASE_MS);

        audioReplay();

        player.playbackRate = 1;
        await player.play().catch(() => {});
        await waitUntilTime(clamp(slowStart - ADVANCE, 0, player.duration));

        player.currentTime = slowStart;
        await sleep(10);
        player.playbackRate = SLOW_RATE;

        await new Promise((resolve) => {
          const onTime = () => {
            if ((player.currentTime || 0) >= clipEnd - 0.03) {
              player.pause();
              player.removeEventListener("timeupdate", onTime);
              resolve();
            }
          };
          player.addEventListener("timeupdate", onTime);
        });

        player.playbackRate = 1;
        exporter.zoomOut();
        await sleep(ZOOM_EASE_MS);
        exporter.normal();

        ramp(gainMusic, 0.0);
        safe(() => musicEl.pause());
        await sleep(100);
      }
    }

    exporter.stop();
    await sleep(260);
    rec.stop();

    const blob = await new Promise((res) => {
      rec.onstop = () => res(new Blob(chunks, { type: mime }));
    });

    try { stopExportAudio(); } catch {}
    try { if (ac) ac.close(); } catch {}

    player.muted = false;
    forceAudioOnForPreview();
    forceInlineVideo();

    return blob;
    }

    // ---------- Share helper ----------
    async function shareFile(blob, mime, filename) {
    const file = new File([blob], filename, { type: mime });
    if (!navigator.share) return false;
    try {
      if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
      await navigator.share({ title: "MyRePlayTV", text: "TV-style replay made with MyRePlayTV", files: [file] });
      return true;
    } catch (e) {
      console.warn("Share failed:", e);
      return false;
    }
    }

    // ---------- Share Original ----------
    if (btnShareOriginal) {
    btnShareOriginal.onclick = async (e) => {
      e?.preventDefault?.(); e?.stopPropagation?.();
      try {
        if (!originalBlob) return showModal("MyRePlayTV", tr().NoVideo || STR.en.NoVideo);
        setStatus(tr().SharePreparing || STR.en.SharePreparing);

        const ok = await shareFile(
          originalBlob,
          "video/mp4",
          `MyRePlayTV_Original_${Date.now()}.mp4`
        );

        if (!ok) showModal("MyRePlayTV", tr().ShareFail || STR.en.ShareFail);
        else setStatus(tr().Done || STR.en.Done);
      } catch (err) {
        showModal(tr().ExportError || STR.en.ExportError, String(err?.message || err || "Share failed."));
        setStatus(tr().Ready || STR.en.Ready);
      } finally {
        enableControls(!!originalUrl);
      }
    };
    }

    // ---------- Share Generated ----------
    if (btnShareGenerated) {
    btnShareGenerated.onclick = async (e) => {
      e?.preventDefault?.(); e?.stopPropagation?.();
      if (!generatedBlob) return showModal("MyRePlayTV", "Generate first.");

      const mode = (modeSel?.value || "full");
      const name = mode === "replays" ? "ReplaysOnly" : "OriginalPlusReplays";

      try {
        // share precisa ficar no gesto do clique → NÃO atrasar demais
        setStatus(tr().SharePreparing || STR.en.SharePreparing);
        const ok = await shareFile(generatedBlob, generatedMime || "video/webm", `MyRePlayTV_${name}_${Date.now()}.mp4`);
        if (!ok) showModal("MyRePlayTV", tr().ShareFail || STR.en.ShareFail);
        else setStatus(tr().Done || STR.en.Done);
      } catch (err) {
        showModal(tr().ExportError || STR.en.ExportError, String(err?.message || err || "Share failed."));
        setStatus(tr().Ready || STR.en.Ready);
      } finally {
        enableControls(!!originalUrl);
      }
    };
    }
    // ---------- Generate button ----------
    if (btnGenerate) {
      btnGenerate.onclick = async (e) => {
        e?.preventDefault?.(); e?.stopPropagation?.();
        if (window.__MRP_LOCKED__) return;

        if (!player || !player.duration) return showModal("MyRePlayTV", tr().NoVideo || STR.en.NoVideo);
        if (marks.length === 0) return showModal("MyRePlayTV", tr().NeedMark || STR.en.NeedMark);
        if ((player.duration || 0) > MAX_SECONDS + 0.5) return showModal("MyRePlayTV", tr().TooLong || STR.en.TooLong);

        if (isUsageBlocked()) {
          showModal(tr().UpgradeTitle || STR.en.UpgradeTitle, (tr().UsageBlocked || STR.en.UsageBlocked) + "\n\n" + (tr().UpgradeBody || STR.en.UpgradeBody));
          return;
        }

        const mode = (modeSel?.value || "full");

        try {
          setLocked(true);
          setStatus(tr().Gen || STR.en.Gen);

          clearGenerated();

          const ok = await consumeOneExport();
          await fetchUsage();
          refreshUsageUI();

          if (!ok) {
            showModal(tr().UpgradeTitle || STR.en.UpgradeTitle, (tr().UsageBlocked || STR.en.UsageBlocked) + "\n\n" + (tr().UpgradeBody || STR.en.UpgradeBody));
            setStatus(tr().Ready || STR.en.Ready);
            return;
          }

          const blob = await generateTV(mode);

          generatedBlob = blob;
          generatedMime = generatedMime || "video/webm";

          if (generatedUrl) URL.revokeObjectURL(generatedUrl);
          generatedUrl = URL.createObjectURL(blob);

          if (btnPreviewGenerated) btnPreviewGenerated.disabled = false;
          if (btnShareGenerated) btnShareGenerated.disabled = false;

          // auto preview generated
          player.pause();
          player.srcObject = null;
          player.playbackRate = 1;
          player.src = generatedUrl;
          player.controls = true;
          player.load();
          forceAudioOnForPreview();
          forceInlineVideo();
          await player.play().catch(() => {});

          setStatus(tr().Done || STR.en.Done);
        } catch (err) {
          console.error(err);
          showModal(tr().ExportError || STR.en.ExportError, String(err?.message || err || "Try shorter video or fewer marks."));
          setStatus(tr().Ready || STR.en.Ready);
        } finally {
          setLocked(false);
          enableControls(!!originalUrl);
          refreshUsageUI();
        }
      };
    }

    // ---------- Start ----------
    (async function init() {
      enableControls(false);
      renderMarks();
      setStatus(tr().Ready || STR.en.Ready);
      forceInlineVideo();
      updateBadges();
      applyLang();

      await fetchUsage();
      refreshUsageUI();

      // Se tiver vídeo já no player por algum motivo, libera
      if (player?.src) enableControls(true);
    })();

  })(); // end IIFE