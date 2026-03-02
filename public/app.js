// MyRePlayTV — app.js (Opção A: FFmpeg backend concat)
// Tudo em IIFE. Mantém câmera/marcas/idiomas/lock/usage.

window.addEventListener("unhandledrejection", (e) => {
  const reason = String(e?.reason?.name || e?.reason || "");
  if (reason.includes("AbortError")) e.preventDefault();
});

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function safe(fn) { try { return fn(); } catch { return undefined; } }

  // DOM (IDs 100% iguais ao index.html)
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

  // Blindagem: nenhum botão vira submit
  (function fixButtonTypes() {
    [
      btnCam, btnUpload, btnGenerate, btnMark, btnClear, btnDelete,
      leadBtn, repBtn, musicBtn,
      btnPreviewOriginal, btnPreviewGenerated,
      btnShareOriginal, btnShareGenerated,
      recBtn, mOk
    ].filter(Boolean).forEach((b) => { try { b.type = "button"; } catch {} });
  })();

  // Checagem “fatal”: se isso falhar, nada funciona
  (function domSanity() {
    const ok =
      !!player && !!status && !!btnUpload && !!fileInput && !!btnGenerate &&
      !!btnMark && !!btnClear && !!btnDelete && !!marksList &&
      !!modeSel && !!formatSel && !!btnPreviewOriginal &&
      !!btnShareOriginal && !!langSel;

    if (!ok) {
      alert("ERRO: IDs do HTML não batem com o app.js. Verifique index.html.");
      console.log("DOM sanity", {
        player: !!player, status: !!status,
        btnUpload: !!btnUpload, fileInput: !!fileInput,
        btnGenerate: !!btnGenerate, btnMark: !!btnMark,
        btnClear: !!btnClear, btnDelete: !!btnDelete,
        marksList: !!marksList,
        modeSel: !!modeSel, formatSel: !!formatSel,
        btnPreviewOriginal: !!btnPreviewOriginal,
        btnShareOriginal: !!btnShareOriginal,
        langSel: !!langSel,
      });
    }
  })();

  const showModal = (t, b) => {
    if (!modalBg || !mTitle || !mBody) return alert(`${t}\n\n${b}`);
    mTitle.textContent = String(t || "MyRePlayTV");
    mBody.textContent = String(b || "");
    modalBg.style.display = "grid";
  };
  const hideModal = () => { if (modalBg) modalBg.style.display = "none"; };
  if (mOk) mOk.onclick = hideModal;
  if (modalBg) modalBg.addEventListener("click", (e) => { if (e.target === modalBg) hideModal(); });

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
      ShareFail: "Sharing not available.",
      ExportError: "Export error",
      Usage: (left, max) => `Free demo: ${left}/${max} exports left this month`,
      UsageUnknown: "Free demo: usage counter loading…",
      UsageBlocked: "Free demo limit reached for this month.",
      UpgradeTitle: "Premium Demo",
      UpgradeBody: "This is a premium demo build. Free users get a limited number of exports per month.",
      BtnImport: "Import",
      BtnCamera: "Camera",
      BtnGenerate: "Generate",
      BtnMark: "⭐ Mark",
      BtnClear: "Clear",
      BtnDelete: "Reset",
      BtnOriginal: "Preview Original",
      BtnGenerated: "Preview Generated",
      BtnShareOriginal: "Share original",
      BtnShareGenerated: "Share generated",
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
      ShareFail: "Compartilhar não disponível.",
      ExportError: "Erro ao exportar",
      Usage: (left, max) => `Demo grátis: ${left}/${max} exports restantes este mês`,
      UsageUnknown: "Demo grátis: carregando contador…",
      UsageBlocked: "Limite mensal da demo atingido.",
      UpgradeTitle: "Demo Premium",
      UpgradeBody: "Este é um build demo premium. Usuários free têm um limite de exports por mês.",
      BtnImport: "Importar",
      BtnCamera: "Câmera",
      BtnGenerate: "Gerar",
      BtnMark: "⭐ Mark",
      BtnClear: "Limpar",
      BtnDelete: "Resetar",
      BtnOriginal: "Prévia Original",
      BtnGenerated: "Prévia Gerado",
      BtnShareOriginal: "Compartilhar original",
      BtnShareGenerated: "Compartilhar gerado",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Música: On",
      MusicOff: "♪ Música: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Só Replays",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
    },
    el: {
      tagline: "Επαναλήψεις τύπου TV σε δευτερόλεπτα",
      Marks: "Σημάδια",
      Hint: "Συμβουλή: Παίξε το βίντεο και πάτησε ⭐ Mark αμέσως μετά τη στιγμή.",
      Ready: "Έτοιμο.",
      Loaded: "Φορτώθηκε.",
      Marked: "Σημειώθηκε.",
      Cleared: "Καθαρίστηκε.",
      Gen: "Δημιουργία…",
      BusyS: "Μην αγγίζεις το βίντεο όσο δημιουργεί",
      NoVideo: "Φόρτωσε πρώτα βίντεο.",
      NeedMark: "Βάλε τουλάχιστον 1 σημάδι (⭐).",
      TooLong: "Μέχρι 2 λεπτά για demo.",
      Done: "Έτοιμο.",
      SharePreparing: "Προετοιμασία…",
      ShareFail: "Το Share δεν υποστηρίζεται.",
      ExportError: "Σφάλμα export",
      Usage: (left, max) => `Demo: ${left}/${max} exports αυτόν τον μήνα`,
      UsageUnknown: "Demo: φόρτωση…",
      UsageBlocked: "Τέλος μηνιαίου ορίου.",
      UpgradeTitle: "Premium Demo",
      UpgradeBody: "Υπάρχει μηνιαίο όριο exports.",
      BtnImport: "Import",
      BtnCamera: "Camera",
      BtnGenerate: "Generate",
      BtnMark: "⭐ Mark",
      BtnClear: "Clear",
      BtnDelete: "Reset",
      BtnOriginal: "Preview Original",
      BtnGenerated: "Preview Generated",
      BtnShareOriginal: "Share original",
      BtnShareGenerated: "Share generated",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Music: On",
      MusicOff: "♪ Music: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Replays only",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
    },
    es: {
      tagline: "Repeticiones estilo TV en segundos",
      Marks: "Marcas",
      Hint: "Tip: Reproduce el video y toca ⭐ Mark justo después del momento.",
      Ready: "Listo.",
      Loaded: "Cargado.",
      Marked: "Marcado.",
      Cleared: "Limpiado.",
      Gen: "Generando…",
      BusyS: "No toques el video mientras procesa",
      NoVideo: "Carga un video primero.",
      NeedMark: "Marca al menos 1 replay (⭐).",
      TooLong: "Máx 2 minutos en demo.",
      Done: "Listo.",
      SharePreparing: "Preparando…",
      ShareFail: "Compartir no disponible.",
      ExportError: "Error al exportar",
      Usage: (left, max) => `Demo: ${left}/${max} exports este mes`,
      UsageUnknown: "Demo: cargando…",
      UsageBlocked: "Límite mensual alcanzado.",
      UpgradeTitle: "Demo Premium",
      UpgradeBody: "Hay un límite mensual de exports.",
      BtnImport: "Importar",
      BtnCamera: "Cámara",
      BtnGenerate: "Generar",
      BtnMark: "⭐ Mark",
      BtnClear: "Limpiar",
      BtnDelete: "Reset",
      BtnOriginal: "Ver Original",
      BtnGenerated: "Ver Generado",
      BtnShareOriginal: "Compartir original",
      BtnShareGenerated: "Compartir generado",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Música: On",
      MusicOff: "♪ Música: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Solo Replays",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
    },
    it: {
      tagline: "Replay stile TV in pochi secondi",
      Marks: "Segni",
      Hint: "Suggerimento: Riproduci il video e tocca ⭐ Mark subito dopo la giocata.",
      Ready: "Pronto.",
      Loaded: "Caricato.",
      Marked: "Segnato.",
      Cleared: "Pulito.",
      Gen: "Generazione…",
      BusyS: "Non toccare il video durante la generazione",
      NoVideo: "Carica prima un video.",
      NeedMark: "Segna almeno 1 replay (⭐).",
      TooLong: "Max 2 minuti in demo.",
      Done: "Fatto.",
      SharePreparing: "Preparazione…",
      ShareFail: "Condivisione non disponibile.",
      ExportError: "Errore export",
      Usage: (left, max) => `Demo: ${left}/${max} exports questo mese`,
      UsageUnknown: "Demo: caricamento…",
      UsageBlocked: "Limite mensile raggiunto.",
      UpgradeTitle: "Demo Premium",
      UpgradeBody: "C’è un limite mensile di exports.",
      BtnImport: "Importa",
      BtnCamera: "Camera",
      BtnGenerate: "Genera",
      BtnMark: "⭐ Mark",
      BtnClear: "Pulisci",
      BtnDelete: "Reset",
      BtnOriginal: "Preview Originale",
      BtnGenerated: "Preview Generato",
      BtnShareOriginal: "Condividi originale",
      BtnShareGenerated: "Condividi generato",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Musica: On",
      MusicOff: "♪ Musica: Off",
      ModeFull: "Originale + Replay",
      ModeReplays: "Solo Replay",
      FormatOriginal: "Originale",
      FormatVertical: "Verticale 9:16",
    },
  };

  let lang = (langSel?.value || "pt");
  function tr() { return STR[lang] || STR.en; }

  function setStatus(t) { if (status) status.textContent = String(t || ""); }

  function applyLang() {
    const T = tr();
    if (tagline) tagline.textContent = T.tagline;
    if (marksTitle) marksTitle.textContent = T.Marks;
    if (hintText) hintText.textContent = T.Hint;

    if (btnUpload) btnUpload.textContent = T.BtnImport;
    if (btnCam) btnCam.textContent = T.BtnCamera;
    if (btnGenerate) btnGenerate.textContent = T.BtnGenerate;
    if (btnMark) btnMark.textContent = T.BtnMark;
    if (btnClear) btnClear.textContent = T.BtnClear;
    if (btnDelete) btnDelete.textContent = T.BtnDelete;

    if (btnPreviewOriginal) btnPreviewOriginal.textContent = T.BtnOriginal;
    if (btnPreviewGenerated) btnPreviewGenerated.textContent = T.BtnGenerated;
    if (btnShareOriginal) btnShareOriginal.textContent = T.BtnShareOriginal;
    if (btnShareGenerated) btnShareGenerated.textContent = T.BtnShareGenerated;

    if (modeSel) {
      const o1 = modeSel.querySelector('option[value="full"]');
      const o2 = modeSel.querySelector('option[value="replays"]');
      if (o1) o1.textContent = T.ModeFull;
      if (o2) o2.textContent = T.ModeReplays;
    }
    if (formatSel) {
      const o1 = formatSel.querySelector('option[value="original"]');
      const o2 = formatSel.querySelector('option[value="vertical"]');
      if (o1) o1.textContent = T.FormatOriginal;
      if (o2) o2.textContent = T.FormatVertical;
    }

    updateBadges();
    refreshUsageUI();
  }

  if (langSel) langSel.onchange = () => { lang = langSel.value || "pt"; applyLang(); };

  // ---------- State ----------
  let marks = [];
  let leadIn = 3;   // 1..10
  let repeats = 1;  // 1..3
  const MAX_SECONDS = 120;

  // “peak sync” (mantido)
  const AFTER_SEC = 2.0;
  const SLOW_RATE = 0.55;
  const PEAK_LOOKBACK = 0.70;
  const PEAK_LOOKAHEAD = 0.12;
  const PEAK_STEP = 0.08;
  const PEAK_LEAD = 0.14;

  // backend tuning
  const BACKEND_ZOOM = 1.18;
  const ADVANCE = 0.08;

  // URLs / blobs
  let originalUrl = null;
  let originalBlob = null;
  let generatedBlob = null;
  let generatedUrl = null;

  // Music
  let musicFile = null;
  let musicUrl = null;

  // Camera
  let camStream = null;
  let camRecorder = null;
  let camChunks = [];
  let cameraOn = false;

  // zoom camera
  let camZoom = 1.0;
  let camZoomMin = 1.0;
  let camZoomMax = 1.0;
  let camZoomSupported = false;

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
      const max = Number(res.data.max ?? DEMO_MAX_EXPORTS);
      const used = Number(res.data.used ?? 0);
      const left = Number(res.data.left ?? Math.max(0, max - used));
      usage = { ok: true, max, used, left };
      usageLoaded = true;
      return;
    }
    usageLoaded = true;
  }

  async function consumeOneExport() {
    const res = await apiJSON("/api/usage/consume", { method: "POST" });
    if (res.ok && res.data) {
      const max = Number(res.data.max ?? DEMO_MAX_EXPORTS);
      const used = Number(res.data.used ?? 0);
      const left = Number(res.data.left ?? Math.max(0, max - used));
      usage = { ok: true, max, used, left };
      usageLoaded = true;
      return true;
    }
    return false;
  }

  function refreshUsageUI() {
    if (!usageLine) return;
    const T = tr();
    if (!usageLoaded) { usageLine.textContent = T.UsageUnknown; return; }
    usageLine.textContent = T.Usage(Number(usage.left ?? 0), Number(usage.max ?? DEMO_MAX_EXPORTS));
  }

  function isUsageBlocked() { return usageLoaded && Number(usage.left ?? 0) <= 0; }

  // ---------- LOCK ----------
  function setLocked(on) {
    if (lockOverlay) lockOverlay.style.display = on ? "grid" : "none";
    if (lockTitle) lockTitle.textContent = tr().Gen;
    if (lockSub) lockSub.textContent = tr().BusyS;

    const all = [
      btnCam, btnUpload, btnGenerate, btnMark, btnClear, btnDelete,
      leadBtn, repBtn, musicBtn,
      modeSel, formatSel,
      btnPreviewOriginal, btnPreviewGenerated,
      btnShareOriginal, btnShareGenerated,
      langSel
    ].filter(Boolean);

    all.forEach((b) => { b.disabled = !!on; });
    window.__MRP_LOCKED__ = !!on;

    if (player) {
      player.controls = !on;
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
    if (btnShareOriginal) btnShareOriginal.disabled = !y;

    if (btnPreviewGenerated) btnPreviewGenerated.disabled = !(generatedUrl && y);
    if (btnShareGenerated) btnShareGenerated.disabled = !(generatedBlob && y);
  }

  function clearGenerated() {
    if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    generatedUrl = null;
    generatedBlob = null;
    if (btnPreviewGenerated) btnPreviewGenerated.disabled = true;
    if (btnShareGenerated) btnShareGenerated.disabled = true;
  }

  function updateBadges() {
    const T = tr();
    if (leadBtn) leadBtn.textContent = (T.BtnLead)(leadIn);
    if (repBtn) repBtn.textContent = (T.BtnRep)(repeats);
    if (musicBtn) musicBtn.textContent = musicFile ? (T.MusicOn) : (T.MusicOff);
  }

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
      musicFile = null;
      if (musicUrl) URL.revokeObjectURL(musicUrl);
      musicUrl = null;
      updateBadges();
      return;
    }
    if (musicInput) musicInput.click();
  };

  if (musicInput) musicInput.onchange = () => {
    const f = musicInput.files?.[0];
    if (!f) return;
    musicFile = f;
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    musicUrl = URL.createObjectURL(f);
    updateBadges();
  };

  // ---------- Camera motor ----------
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

    enableControls(true);
    setStatus(tr().Loaded);
  }

  if (btnUpload) btnUpload.onclick = (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    if (!fileInput) return false;
    fileInput.value = "";
    fileInput.click();
    return false;
  };

  if (fileInput) fileInput.onchange = (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
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
      showModal("Camera blocked", "Allow camera + microphone permissions.");
    }
  }

  if (btnCam) btnCam.onclick = () => (cameraOn ? stopCamera() : startCamera());

  // Pinch zoom (real track when supported)
  (function enableCameraPinchZoom() {
    const videoWrap = document.getElementById("videoWrap") || (player ? player.parentElement : null);
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
        } catch {}
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

    const _stop = stopCamera;
    stopCamera = function () {
      _stop();
      try { player.style.transform = "none"; } catch {}
      camZoom = 1.0;
    };
  })();

  // REC
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
          <button type="button" class="btn small" data-go="${t}">Go</button>
          <button type="button" class="btn small dangerGhost" data-del="${idx}">Delete</button>
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
    if (!player || !player.duration) return showModal("MyRePlayTV", tr().NoVideo);
    marks.push(Number(player.currentTime || 0));
    renderMarks();
    setStatus(tr().Marked);
  };

  if (btnClear) btnClear.onclick = () => {
    marks = [];
    renderMarks();
    setStatus(tr().Cleared);
  };

  if (btnDelete) btnDelete.onclick = () => {
    marks = [];
    renderMarks();
    clearGenerated();

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    originalUrl = null;
    originalBlob = null;

    safe(() => { player.pause(); });

    if (player) {
      player.srcObject = null;
      player.src = "";
      player.controls = false;
    }

    enableControls(false);
    forceInlineVideo();
    setStatus(tr().Ready);
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

  // ---------- Motion peak search ----------
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

  if (btnShareOriginal) {
    btnShareOriginal.onclick = async (e) => {
      e?.preventDefault?.(); e?.stopPropagation?.();
      try {
        if (!originalBlob) return showModal("MyRePlayTV", tr().NoVideo);
        setStatus(tr().SharePreparing);

        const ok = await shareFile(originalBlob, "video/mp4", `MyRePlayTV_Original_${Date.now()}.mp4`);
        if (!ok) showModal("MyRePlayTV", tr().ShareFail);
        else setStatus(tr().Done);
      } catch (err) {
        showModal(tr().ExportError, String(err?.message || err || "Share failed."));
        setStatus(tr().Ready);
      } finally {
        enableControls(!!originalUrl);
      }
    };
  }

  if (btnShareGenerated) {
    btnShareGenerated.onclick = async (e) => {
      e?.preventDefault?.(); e?.stopPropagation?.();
      if (!generatedBlob) return showModal("MyRePlayTV", "Generate first.");

      try {
        setStatus(tr().SharePreparing);
        const ok = await shareFile(generatedBlob, "video/mp4", `MyRePlayTV_${Date.now()}.mp4`);
        if (!ok) showModal("MyRePlayTV", tr().ShareFail);
        else setStatus(tr().Done);
      } catch (err) {
        showModal(tr().ExportError, String(err?.message || err || "Share failed."));
        setStatus(tr().Ready);
      } finally {
        enableControls(!!originalUrl);
      }
    };
  }

  // ---------- Backend Generate ----------
  async function backendGenerate({ mode, format, items }) {
    if (!originalBlob) throw new Error("Missing originalBlob");

    const fd = new FormData();
    fd.append("file", originalBlob, `original-${Date.now()}.mp4`);
    if (musicFile) fd.append("music", musicFile, `music-${Date.now()}.mp3`);

    const config = {
      mode,
      format,
      leadIn,
      repeats,
      afterSec: AFTER_SEC,
      slowRate: SLOW_RATE,
      advance: ADVANCE,
      zoom: BACKEND_ZOOM,
      watermark: true,
      items, // [{mark, slowStart}]
    };
    fd.append("config", JSON.stringify(config));

    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "x-mrp-token": DEMO_TOKEN, "x-demo-token": DEMO_TOKEN },
      body: fd,
    });

    if (!r.ok) {
      let msg = `Generate failed (${r.status})`;
      try {
        const j = await r.json();
        msg = j?.detail || j?.error || msg;
      } catch {}
      throw new Error(msg);
    }

    return await r.blob();
  }

  // ---------- Generate button ----------
  if (btnGenerate) {
    btnGenerate.onclick = async (e) => {
      e?.preventDefault?.(); e?.stopPropagation?.();
      if (window.__MRP_LOCKED__) return;

      if (!player || !player.duration) return showModal("MyRePlayTV", tr().NoVideo);
      if (marks.length === 0) return showModal("MyRePlayTV", tr().NeedMark);
      if ((player.duration || 0) > MAX_SECONDS + 0.5) return showModal("MyRePlayTV", tr().TooLong);

      if (isUsageBlocked()) {
        showModal(tr().UpgradeTitle, (tr().UsageBlocked) + "\n\n" + (tr().UpgradeBody));
        return;
      }

      const mode = (modeSel?.value || "full");
      const format = (formatSel?.value || "original");

      try {
        setLocked(true);
        setStatus(tr().Gen);
        clearGenerated();

        const ok = await consumeOneExport();
        await fetchUsage();
        refreshUsageUI();

        if (!ok) {
          showModal(tr().UpgradeTitle, (tr().UsageBlocked) + "\n\n" + (tr().UpgradeBody));
          setStatus(tr().Ready);
          return;
        }

        setStatus("Auto-syncing marks…");
        const sorted = marks.slice().sort((a, b) => a - b);
        const savedT = player.currentTime || 0;

        const items = [];
        for (const m of sorted) {
          const slowStart = await findPeak(m);
          items.push({ mark: m, slowStart });
        }

        player.currentTime = clamp(savedT, 0, player.duration);
        await waitSeek();

        setStatus("FFmpeg rendering…");
        const blob = await backendGenerate({ mode, format, items });

        generatedBlob = blob;
        if (generatedUrl) URL.revokeObjectURL(generatedUrl);
        generatedUrl = URL.createObjectURL(blob);

        if (btnPreviewGenerated) btnPreviewGenerated.disabled = false;
        if (btnShareGenerated) btnShareGenerated.disabled = false;

        // auto preview
        player.pause();
        player.srcObject = null;
        player.playbackRate = 1;
        player.src = generatedUrl;
        player.controls = true;
        player.load();
        forceAudioOnForPreview();
        forceInlineVideo();
        await player.play().catch(() => {});

        setStatus(tr().Done);
      } catch (err) {
        console.error(err);
        showModal(tr().ExportError, String(err?.message || err || "Try shorter video or fewer marks."));
        setStatus(tr().Ready);
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
    forceInlineVideo();

    applyLang();
    updateBadges();
    setStatus(tr().Ready);

    await fetchUsage();
    refreshUsageUI();

    if (player?.src) enableControls(true);
  })();
})();