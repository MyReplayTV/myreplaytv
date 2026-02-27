// iOS Safari: avoid UI-breaking unhandled AbortError noise
window.addEventListener("unhandledrejection", (e) => {
  const reason = String(e?.reason?.name || e?.reason || "");
  if (reason.includes("AbortError")) e.preventDefault();
});

(() => {
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const lerp = (a, b, t) => a + (b - a) * t;

  // UI
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

  const btnDlOriginal = $("btnDlOriginal");
  const btnDlGenerated = $("btnDlGenerated");
  const btnShareGenerated = $("btnShareGenerated");

  const marksList = $("marksList");

  const langSel = $("langSel");
  const tagline = $("tagline");
  const marksTitle = $("marksTitle");
  const hintText = $("hintText");

  // premium/demo counter UI (optional; we create if missing)
  let usageLine = $("usageLine");

  const lockOverlay = $("lockOverlay");
  const lockTitle = $("lockTitle");
  const lockSub = $("lockSub");

  const recBtn = $("recBtn");

  // modal
  const modalBg = $("modalBg");
  const mTitle = $("mTitle");
  const mBody = $("mBody");
  const mOk = $("mOk");
  const showModal = (t, b) => {
    if (!modalBg) {
      alert(`${t}\n\n${b}`);
      return;
    }
    mTitle.textContent = t;
    mBody.textContent = b;
    modalBg.style.display = "flex";
  };
  const hideModal = () => { if (modalBg) modalBg.style.display = "none"; };
  if (mOk) mOk.onclick = hideModal;
  if (modalBg) modalBg.addEventListener("click", (e) => { if (e.target === modalBg) hideModal(); });

  // Hard-safety: keep video INLINE on iOS (prevents fullscreen stealing UI)
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
      ExportTip: "If iPhone blocks download: new tab → Share → Save Video.",
      NoVideo: "Load a video first.",
      NeedMark: "Mark at least 1 replay (⭐).",
      CamBlocked: "Allow camera + microphone permissions.",
      ShareFail: "Sharing not available. Use Download.",
      Done: "Done. Preview: Generated.",
      TooLong: "Max 2 minutes for demo. Trim the video and try again.",
      Usage: (left, max) => `Free demo: ${left}/${max} exports left this month`,
      UsageUnknown: "Free demo: usage counter loading…",
      UsageBlocked: "Free demo limit reached for this month.",
      BtnImport: "Import",
      BtnCamera: "Camera",
      BtnGenerate: "Generate",
      BtnMark: "⭐ Mark",
      BtnClear: "Clear",
      BtnDelete: "Delete",
      BtnOriginal: "Preview Original",
      BtnGenerated: "Preview Generated",
      BtnDlOriginal: "Download Original",
      BtnDlGenerated: "Download Video",
      BtnShare: "Share",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Music: On",
      MusicOff: "♪ Music: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Replays only",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
      BackToEdit: "Back to edit",
      ServerMp4: "Optimizing for WhatsApp (MP4)…",
      ServerMp4Slow: "MP4 can take a bit. Please keep the screen on.",
      Mp4Fallback: "MP4 failed. Using WebM preview.",
      SharePreparing: "Preparing share…",
      ExportError: "Export error",
      UpgradeTitle: "Premium Demo",
      UpgradeBody: "This is a premium demo build. Free users get a limited number of exports per month."
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
      ExportTip: "Se o iPhone bloquear download: nova aba → Compartilhar → Salvar Vídeo.",
      NoVideo: "Carregue um vídeo primeiro.",
      NeedMark: "Marque pelo menos 1 replay (⭐).",
      CamBlocked: "Permita câmera + microfone.",
      ShareFail: "Compartilhar não disponível. Use Download.",
      Done: "Pronto. Prévia: Gerado.",
      TooLong: "Máx 2 minutos na demo. Corte o vídeo e tente de novo.",
      Usage: (left, max) => `Demo grátis: ${left}/${max} exports restantes este mês`,
      UsageUnknown: "Demo grátis: carregando contador…",
      UsageBlocked: "Limite mensal da demo atingido.",
      BtnImport: "Importar",
      BtnCamera: "Câmera",
      BtnGenerate: "Gerar",
      BtnMark: "⭐ Mark",
      BtnClear: "Limpar",
      BtnDelete: "Apagar",
      BtnOriginal: "Prévia Original",
      BtnGenerated: "Prévia Gerado",
      BtnDlOriginal: "Baixar Original",
      BtnDlGenerated: "Baixar Vídeo",
      BtnShare: "Compartilhar",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Música: On",
      MusicOff: "♪ Música: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Só Replays",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
      BackToEdit: "Voltar editar",
      ServerMp4: "Otimizando para WhatsApp (MP4)…",
      ServerMp4Slow: "MP4 pode demorar. Deixe a tela ligada.",
      Mp4Fallback: "Falhou MP4. Usando prévia WebM.",
      SharePreparing: "Preparando envio…",
      ExportError: "Erro ao exportar",
      UpgradeTitle: "Demo Premium",
      UpgradeBody: "Este é um build demo premium. Usuários free têm um limite de exports por mês."
    },
    el: {
      tagline: "Επαναλήψεις τύπου TV σε δευτερόλεπτα",
      Marks: "Σημάδια",
      Hint: "Συμβουλή: Παίξε το βίντεο και πάτησε ⭐ Mark αμέσως μετά τη στιγμή. Αυτόματο sync στο peak κίνησης.",
      Ready: "Έτοιμο. Import ή Camera.",
      Loaded: "Φορτώθηκε. Play ▶ και μετά ⭐ Mark. Generate όποτε θέλεις.",
      Marked: "Σημειώθηκε. Βάλε κι άλλα ή Generate.",
      Cleared: "Καθαρίστηκαν.",
      Gen: "Δημιουργία…",
      BusyS: "Μην αγγίζεις το βίντεο όσο δημιουργεί",
      ExportTip: "Αν το iPhone μπλοκάρει: νέα καρτέλα → Share → Save Video.",
      NoVideo: "Φόρτωσε πρώτα βίντεο.",
      NeedMark: "Βάλε τουλάχιστον 1 σημάδι (⭐).",
      CamBlocked: "Δώσε άδεια σε κάμερα + μικρόφωνο.",
      ShareFail: "Share δεν υποστηρίζεται. Χρησιμοποίησε Download.",
      Done: "Έτοιμο. Προεπισκόπηση: Generated.",
      TooLong: "Μέχρι 2 λεπτά για demo. Κόψε το βίντεο και ξανά.",
      Usage: (left, max) => `Demo: ${left}/${max} exports αυτόν τον μήνα`,
      UsageUnknown: "Demo: φόρτωση μετρητή…",
      UsageBlocked: "Τέλος μηνιαίου ορίου demo.",
      BtnImport: "Import",
      BtnCamera: "Camera",
      BtnGenerate: "Generate",
      BtnMark: "⭐ Mark",
      BtnClear: "Clear",
      BtnDelete: "Delete",
      BtnOriginal: "Preview Original",
      BtnGenerated: "Preview Generated",
      BtnDlOriginal: "Download Original",
      BtnDlGenerated: "Download Video",
      BtnShare: "Share",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Music: On",
      MusicOff: "♪ Music: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Replays only",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
      BackToEdit: "Back to edit",
      ServerMp4: "MP4 για WhatsApp…",
      ServerMp4Slow: "Το MP4 ίσως αργήσει. Κράτα την οθόνη ανοιχτή.",
      Mp4Fallback: "Αποτυχία MP4. Χρήση WebM.",
      SharePreparing: "Προετοιμασία share…",
      ExportError: "Σφάλμα export",
      UpgradeTitle: "Premium Demo",
      UpgradeBody: "Premium demo build. Υπάρχει όριο exports ανά μήνα."
    },
    es: {
      tagline: "Repeticiones estilo TV en segundos",
      Marks: "Marcas",
      Hint: "Tip: Reproduce el video y toca ⭐ Mark justo después del momento. Auto-sync al pico de movimiento.",
      Ready: "Listo. Importar o Cámara.",
      Loaded: "Cargado. Play ▶ y luego ⭐ Mark. Genera cuando quieras.",
      Marked: "Marcado. Agrega más o Genera.",
      Cleared: "Marcas limpiadas.",
      Gen: "Generando…",
      BusyS: "No toques el video mientras procesa",
      ExportTip: "Si el iPhone bloquea: nueva pestaña → Share → Save Video.",
      NoVideo: "Carga un video primero.",
      NeedMark: "Marca al menos 1 replay (⭐).",
      CamBlocked: "Permite cámara + micrófono.",
      ShareFail: "Compartir no disponible. Usa Download.",
      Done: "Listo. Vista previa: Generado.",
      TooLong: "Máx 2 minutos en demo. Recorta y prueba otra vez.",
      Usage: (left, max) => `Demo: ${left}/${max} exports este mes`,
      UsageUnknown: "Demo: cargando contador…",
      UsageBlocked: "Límite mensual de demo alcanzado.",
      BtnImport: "Importar",
      BtnCamera: "Cámara",
      BtnGenerate: "Generar",
      BtnMark: "⭐ Mark",
      BtnClear: "Limpiar",
      BtnDelete: "Borrar",
      BtnOriginal: "Ver Original",
      BtnGenerated: "Ver Generado",
      BtnDlOriginal: "Descargar Original",
      BtnDlGenerated: "Descargar Video",
      BtnShare: "Compartir",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Música: On",
      MusicOff: "♪ Música: Off",
      ModeFull: "Original + Replays",
      ModeReplays: "Solo Replays",
      FormatOriginal: "Original",
      FormatVertical: "Vertical 9:16",
      BackToEdit: "Volver a editar",
      ServerMp4: "Optimizar a MP4…",
      ServerMp4Slow: "MP4 puede tardar. Mantén la pantalla encendida.",
      Mp4Fallback: "Falló MP4. Usando WebM.",
      SharePreparing: "Preparando compartir…",
      ExportError: "Error al exportar",
      UpgradeTitle: "Demo Premium",
      UpgradeBody: "Build demo premium. Hay un límite mensual de exports."
    },
    it: {
      tagline: "Replay stile TV in pochi secondi",
      Marks: "Segni",
      Hint: "Suggerimento: Riproduci il video e tocca ⭐ Mark subito dopo il momento. Auto-sync sul picco di movimento.",
      Ready: "Pronto. Importa o Camera.",
      Loaded: "Caricato. Play ▶ poi ⭐ Mark. Genera quando vuoi.",
      Marked: "Marcato. Aggiungi altri o Genera.",
      Cleared: "Segni cancellati.",
      Gen: "Generazione…",
      BusyS: "Non toccare il video durante la generazione",
      ExportTip: "Se iPhone blocca: nuova scheda → Share → Save Video.",
      NoVideo: "Carica prima un video.",
      NeedMark: "Segna almeno 1 replay (⭐).",
      CamBlocked: "Consenti camera + microfono.",
      ShareFail: "Condivisione non disponibile. Usa Download.",
      Done: "Fatto. Anteprima: Generato.",
      TooLong: "Max 2 minuti in demo. Taglia il video e riprova.",
      Usage: (left, max) => `Demo: ${left}/${max} exports questo mese`,
      UsageUnknown: "Demo: caricamento contatore…",
      UsageBlocked: "Limite demo mensile raggiunto.",
      BtnImport: "Importa",
      BtnCamera: "Camera",
      BtnGenerate: "Genera",
      BtnMark: "⭐ Mark",
      BtnClear: "Pulisci",
      BtnDelete: "Elimina",
      BtnOriginal: "Preview Originale",
      BtnGenerated: "Preview Generato",
      BtnDlOriginal: "Download Originale",
      BtnDlGenerated: "Download Video",
      BtnShare: "Condividi",
      BtnLead: (s) => `↩︎ ${s}s`,
      BtnRep: (x) => `⟲ ${x}×`,
      MusicOn: "♪ Musica: On",
      MusicOff: "♪ Musica: Off",
      ModeFull: "Originale + Replay",
      ModeReplays: "Solo Replay",
      FormatOriginal: "Originale",
      FormatVertical: "Verticale 9:16",
      BackToEdit: "Torna a modificare",
      ServerMp4: "Ottimizzo MP4…",
      ServerMp4Slow: "MP4 può richiedere tempo. Tieni lo schermo acceso.",
      Mp4Fallback: "MP4 fallito. Uso WebM.",
      SharePreparing: "Preparo condivisione…",
      ExportError: "Errore export",
      UpgradeTitle: "Demo Premium",
      UpgradeBody: "Build demo premium. C’è un limite mensile di exports."
    }
  };

  let lang = (langSel?.value || "en");
  function tr() { return STR[lang] || STR.en; }
  function ensureUsageLine() {
    if (usageLine) return usageLine;
    // Create a subtle line under status if not present in HTML
    const host = status?.parentElement || document.body;
    const el = document.createElement("div");
    el.id = "usageLine";
    el.style.fontSize = "12px";
    el.style.opacity = "0.86";
    el.style.marginTop = "6px";
    el.style.textAlign = "center";
    el.textContent = tr().UsageUnknown;
    host.appendChild(el);
    usageLine = el;
    return el;
  }
  ensureUsageLine();

  function applyLang() {
    if (tagline) tagline.textContent = tr().tagline;
    if (marksTitle) marksTitle.textContent = tr().Marks;
    if (hintText) hintText.textContent = tr().Hint;

    if (btnUpload) btnUpload.textContent = tr().BtnImport;
    if (btnCam) btnCam.textContent = tr().BtnCamera;
    if (btnGenerate) btnGenerate.textContent = tr().BtnGenerate;
    if (btnMark) btnMark.textContent = tr().BtnMark;
    if (btnClear) btnClear.textContent = tr().BtnClear;
    if (btnDelete) btnDelete.textContent = tr().BtnDelete;

    if (btnPreviewOriginal) btnPreviewOriginal.textContent = tr().BtnOriginal;
    if (btnPreviewGenerated) btnPreviewGenerated.textContent = tr().BtnGenerated;

    if (btnDlOriginal) btnDlOriginal.textContent = tr().BtnDlOriginal;
    if (btnDlGenerated) btnDlGenerated.textContent = tr().BtnDlGenerated;
    if (btnShareGenerated) btnShareGenerated.textContent = tr().BtnShare;

    // Update select labels (keep values stable)
    if (modeSel) {
      const o1 = modeSel.querySelector('option[value="full"]');
      const o2 = modeSel.querySelector('option[value="replays"]');
      if (o1) o1.textContent = tr().ModeFull;
      if (o2) o2.textContent = tr().ModeReplays;
    }
    if (formatSel) {
      const o1 = formatSel.querySelector('option[value="original"]');
      const o2 = formatSel.querySelector('option[value="vertical"]');
      if (o1) o1.textContent = tr().FormatOriginal;
      if (o2) o2.textContent = tr().FormatVertical;
    }
  }

  if (langSel) {
    langSel.onchange = () => {
      lang = langSel.value || "en";
      applyLang();
      refreshUsageUI(); // re-render text
    };
  }
  applyLang();

  // ---------- State ----------
  let marks = [];
  let leadIn = 3;   // 1..10
  let repeats = 1;  // 1..3

  // Limits (Demo)
  const MAX_SECONDS = 120;

  // Replay behavior
  const AFTER_SEC = 2.0;
  const SLOW_RATE = 0.55;

  // Auto-sync peak (motion)
  const PEAK_LOOKBACK = 0.70;
  const PEAK_LOOKAHEAD = 0.12;
  const PEAK_STEP = 0.08;
  const PEAK_LEAD = 0.14;

  // Cinema tuning (premium feel)
  const ZOOM_MAX = 1.22;
  const ZOOM_EASE_MS = 320;
  const FADE_MS = 120;
  const ADVANCE = 0.08;
  const REC_WARMUP_MS = 420;

  // Export quality
  const REC_TIMESLICE = 500;
  const VIDEO_BPS = 12_000_000;
  const FPS_HINT = 24;

  // URLs
  let originalUrl = null;

  // Generated: WebM preview + optional MP4 cache
  let generatedUrl = null;
  let generatedBlob = null;
  let generatedMime = "video/webm";

  let generatedWebmBlob = null;
  let generatedWebmUrl = null;

  let generatedMp4Blob = null;
  let generatedMp4Url = null;

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

  // REAL camera zoom (when supported)
  let camZoom = 1.0;
  let camZoomMin = 1.0;
  let camZoomMax = 1.0;
  let camZoomSupported = false;

  function setStatus(t) { if (status) status.textContent = t; }
  // ---------- DEMO / PREMIUM COUNTER ----------
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

  let usage = { ok: true, month: null, max: DEMO_MAX_EXPORTS, used: 0, left: DEMO_MAX_EXPORTS };
  let usageLoaded = false;

  async function apiJSON(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    headers["x-demo-token"] = DEMO_TOKEN;
    headers["x-mrp-token"] = DEMO_TOKEN; // extra compat
    const r = await fetch(url, { ...opts, headers });
    let data = null;
    try { data = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data };
  }

  async function fetchUsage() {
    const res = await apiJSON("/api/usage");
    if (res.ok && res.data) {
      usage = {
        ok: true,
        month: res.data.month || null,
        max: Number(res.data.max ?? res.data.limit ?? DEMO_MAX_EXPORTS),
        used: Number(res.data.used ?? 0),
        left: Number(res.data.left ?? Math.max(0, DEMO_MAX_EXPORTS - (res.data.used || 0))),
      };
      usageLoaded = true;
      return;
    }

    // fallback local
    const key = "mrp_local_usage_" + new Date().toISOString().slice(0, 7);
    const used = Number(localStorage.getItem(key) || "0");
    usage = { ok: true, month: key.slice(-7), max: DEMO_MAX_EXPORTS, used, left: Math.max(0, DEMO_MAX_EXPORTS - used) };
    usageLoaded = true;
  }

  async function consumeOneExport() {
    const res = await apiJSON("/api/usage/consume", { method: "POST" });
    if (res.ok && res.data) {
      usage = {
        ok: true,
        month: res.data.month || null,
        max: Number(res.data.max ?? res.data.limit ?? DEMO_MAX_EXPORTS),
        used: Number(res.data.used ?? 0),
        left: Number(res.data.left ?? Math.max(0, DEMO_MAX_EXPORTS - (res.data.used || 0))),
      };
      usageLoaded = true;
      return true;
    }

    // fallback local consume
    const key = "mrp_local_usage_" + new Date().toISOString().slice(0, 7);
    const used = Number(localStorage.getItem(key) || "0");
    if (used >= DEMO_MAX_EXPORTS) return false;
    localStorage.setItem(key, String(used + 1));
    usage = { ok: true, month: key.slice(-7), max: DEMO_MAX_EXPORTS, used: used + 1, left: Math.max(0, DEMO_MAX_EXPORTS - (used + 1)) };
    usageLoaded = true;
    return true;
  }

  function refreshUsageUI() {
    ensureUsageLine();
    if (!usageLoaded) {
      usageLine.textContent = tr().UsageUnknown;
      return;
    }
    usageLine.textContent = tr().Usage(usage.left, usage.max);
    usageLine.style.opacity = usage.left <= 1 ? "0.95" : "0.86";
  }

  function isUsageBlocked() {
    return usageLoaded && usage.left <= 0;
  }

  // -------- LOCK: blocks interactions while generating --------
  function setLocked(on) {
    if (lockOverlay) lockOverlay.style.display = on ? "flex" : "none";
    if (lockTitle) lockTitle.textContent = tr().Gen;
    if (lockSub) lockSub.textContent = tr().BusyS;

    const allBtns = [
      btnCam, btnUpload, btnGenerate, btnMark, btnClear, btnDelete,
      leadBtn, repBtn, musicBtn, modeSel, formatSel,
      btnPreviewOriginal, btnPreviewGenerated, btnDlOriginal, btnDlGenerated, btnShareGenerated,
      langSel
    ].filter(Boolean);

    allBtns.forEach(b => { b.disabled = on; });

    window.__MRP_LOCKED__ = on;

    if (player) {
      player.controls = false;
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
  ["touchstart", "touchmove", "touchend", "pointerdown", "pointerup", "click", "dblclick", "keydown", "wheel"].forEach(evt => {
    window.addEventListener(evt, blockIfLocked, { capture: true, passive: false });
  });

  function enableControls(yes) {
    if (btnGenerate) btnGenerate.disabled = !yes;
    if (btnMark) btnMark.disabled = !yes;
    if (btnClear) btnClear.disabled = !yes;
    if (btnDelete) btnDelete.disabled = !yes;
    if (btnDlOriginal) btnDlOriginal.disabled = !yes;
    if (modeSel) modeSel.disabled = !yes;
    if (formatSel) formatSel.disabled = !yes;

    if (btnPreviewOriginal) btnPreviewOriginal.disabled = !yes;
    if (btnPreviewGenerated) btnPreviewGenerated.disabled = true;
    if (btnDlGenerated) btnDlGenerated.disabled = true;
    if (btnShareGenerated) btnShareGenerated.disabled = true;
  }
  function clearGenerated() {
    if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    if (generatedWebmUrl) URL.revokeObjectURL(generatedWebmUrl);
    if (generatedMp4Url) URL.revokeObjectURL(generatedMp4Url);

    generatedUrl = null;
    generatedBlob = null;
    generatedMime = "video/webm";

    generatedWebmBlob = null;
    generatedWebmUrl = null;

    generatedMp4Blob = null;
    generatedMp4Url = null;

    if (btnPreviewGenerated) btnPreviewGenerated.disabled = true;
    if (btnDlGenerated) btnDlGenerated.disabled = true;
    if (btnShareGenerated) btnShareGenerated.disabled = true;
  }

  function updateBadges() {
    if (leadBtn) leadBtn.textContent = tr().BtnLead(leadIn);
    if (repBtn) repBtn.textContent = tr().BtnRep(repeats);
    if (musicBtn) musicBtn.textContent = musicUrl ? tr().MusicOn : tr().MusicOff;
  }
  updateBadges();

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
      try { musicEl.pause(); } catch { }
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

  function stopCamera() {
    if (!cameraOn) return;
    if (camRecorder) { try { camRecorder.stop(); } catch { } }
    camRecorder = null;
    camChunks = [];
    if (camStream) camStream.getTracks().forEach(t => t.stop());
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

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    originalUrl = URL.createObjectURL(blob);

    player.pause();
    player.srcObject = null;
    player.playbackRate = 1;
    player.src = originalUrl;
    player.controls = true;
    player.load();
    forceAudioOnForPreview();
    forceInlineVideo();

    exportAudioEl.pause();
    exportAudioEl.src = originalUrl;
    exportAudioEl.load();

    enableControls(true);
    setStatus(tr().Loaded);
  }

  // ---------- IMPORT ----------
  if (btnUpload) btnUpload.onclick = (e) => {
    // ✅ evita qualquer comportamento de navegação/submit no iOS
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!fileInput) return false;

    // garante que não tem "submit" nem nada estranho
    try { btnUpload.type = "button"; } catch {}

    // reset e abre picker
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
  // ---------- Camera ----------
  async function startCamera() {
    if (cameraOn) return;
    try {
      forceInlineVideo();

      camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true
      });

      cameraOn = true;
      camZoom = 1.0;
      camZoomSupported = false;

      player.src = "";
      player.srcObject = camStream;
      player.controls = false;
      player.muted = true;
      forceInlineVideo();

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

      await player.play().catch(() => { });

      if (recBtn) {
        recBtn.style.display = "block";
        recBtn.textContent = "● REC";
      }

      setStatus("Camera ready. Pinch to zoom, then ● REC.");
    } catch (e) {
      console.error(e);
      showModal("Camera blocked", tr().CamBlocked);
    }
  }

  if (btnCam) btnCam.onclick = () => cameraOn ? stopCamera() : startCamera();

  // Pinch zoom (real track when supported)
  (function enableCameraPinchZoom() {
    if (!player) return;

    let wrap = document.getElementById("videoWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "videoWrap";
      const parent = player.parentElement;
      parent.insertBefore(wrap, player);
      wrap.appendChild(player);
    }
    if (recBtn && recBtn.parentElement !== wrap) wrap.appendChild(recBtn);

    let baseZoom = 1.0;
    let pinchDist0 = 0;
    let pinching = false;

    function cameraActive() {
      return cameraOn && !!camStream && !!player.srcObject;
    }

    function dist(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    }

    async function applyZoomToTrack(z) {
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
          // fallback visual
        }
      }

      camZoom = clamp(camZoom, 1, 4);
      player.style.transformOrigin = "center center";
      player.style.transform = `scale(${camZoom})`;
    }

    // Double tap reset
    let lastTap = 0;
    wrap.addEventListener("touchend", async (e) => {
      if (!cameraActive()) return;
      const now = Date.now();
      if (now - lastTap < 280) {
        await applyZoomToTrack(1.0);
        e.preventDefault(); e.stopPropagation();
      }
      lastTap = now;
    }, { passive: false });

    wrap.addEventListener("touchstart", (e) => {
      if (!cameraActive()) return;
      if (e.touches.length === 2) {
        pinching = true;
        baseZoom = camZoom;
        pinchDist0 = dist(e.touches[0], e.touches[1]);
        e.preventDefault(); e.stopPropagation();
      }
    }, { passive: false });

    wrap.addEventListener("touchmove", async (e) => {
      if (!cameraActive()) return;
      if (pinching && e.touches.length === 2) {
        const d = dist(e.touches[0], e.touches[1]);
        const ratio = d / (pinchDist0 || d);
        await applyZoomToTrack(baseZoom * ratio);
        e.preventDefault(); e.stopPropagation();
      }
    }, { passive: false });

    wrap.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) pinching = false;
    }, { passive: true });

    const _stopCamera = stopCamera;
    stopCamera = function () {
      _stopCamera();
      try { player.style.transform = "none"; } catch {}
      camZoom = 1.0;
    };
  })();

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

    try { camRecorder.stop(); } catch { }
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
          <button class="smallBtn" data-go="${t}">Go</button>
          <button class="smallBtn danger" data-del="${idx}">Delete</button>
        </div>
      `;
      marksList.appendChild(row);
    });

    marksList.querySelectorAll("[data-go]").forEach(b => {
      b.onclick = () => {
        const t = Number(b.getAttribute("data-go"));
        player.currentTime = clamp(t - 0.2, 0, player.duration || 1e9);
        forceAudioOnForPreview();
        player.play().catch(() => { });
      };
    });

    marksList.querySelectorAll("[data-del]").forEach(b => {
      b.onclick = () => {
        const idx = Number(b.getAttribute("data-del"));
        const sortedMarks = marks.slice().sort((a, b) => a - b);
        const value = sortedMarks[idx];
        let removed = false;
        marks = marks.filter(x => {
          if (!removed && x === value) { removed = true; return false; }
          return true;
        });
        renderMarks();
      };
    });
  }

  if (btnMark) btnMark.onclick = () => {
    if (!player.duration) return showModal("MyRePlayTV", tr().NoVideo);
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
    exportAudioEl.pause(); exportAudioEl.src = "";
    player.pause();
    player.srcObject = null;
    player.src = "";
    player.controls = false;
    enableControls(false);
    forceInlineVideo();
    setStatus(tr().Ready);
  };

  // ---------- Preview ----------
  if (btnPreviewOriginal) btnPreviewOriginal.onclick = () => {
    if (!originalUrl) return;
    player.pause();
    player.srcObject = null;
    player.playbackRate = 1;
    player.src = originalUrl;
    player.controls = true;
    player.load();
    forceAudioOnForPreview();
    forceInlineVideo();
    player.play().catch(() => { });
  };

  if (btnPreviewGenerated) btnPreviewGenerated.onclick = () => {
    if (!generatedUrl) return;
    player.pause();
    player.srcObject = null;
    player.playbackRate = 1;
    player.src = generatedUrl;
    player.controls = true;
    player.load();
    forceAudioOnForPreview();
    forceInlineVideo();
    player.play().catch(() => { });
  };

  // ===== Motion peak search =====
  const tmp = document.createElement("canvas");
  const tctx = tmp.getContext("2d", { willReadFrequently: true });

  function frameSig() {
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
    return new Promise(res => {
      const on = () => { player.removeEventListener("seeked", on); res(); };
      player.addEventListener("seeked", on, { once: true });
    });
  }

  async function findPeak(markT) {
    const dur = player.duration || 0;
    const start = clamp(markT - PEAK_LOOKBACK, 0, dur);
    const end = clamp(markT + PEAK_LOOKAHEAD, 0, dur);

    player.pause();

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
  // ===== Export drawing =====
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
    ctx.roundRect(x, y, boxW, boxH, 999);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.90)";
    ctx.fillText(text, x + pad * 0.65, y + boxH * 0.70);
    ctx.restore();
  }

  function computeCanvasSize(vw, vh, format) {
    if (format === "vertical") return { cw: 1080, ch: 1920 };

    // força 1080p landscape (1920x1080) quando o vídeo for landscape
    const isLandscape = (vw || 1280) >= (vh || 720);
    if (isLandscape) return { cw: 1920, ch: 1080 };

    // se for portrait e formato original, mantém 1080x1920
    return { cw: 1080, ch: 1920 };
  }

  function drawFrame(ctx, canvasW, canvasH, zoomMode) {
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

    const rvfc = player.requestVideoFrameCallback?.bind(player);
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
    const start = performance.now();
    while (Math.abs((player.currentTime || 0) - t) > 0.18) {
      if (performance.now() - start > 7000) break;
      await sleep(60);
    }
  }

  async function waitUntilTime(target) {
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
    end = clamp(end, 0, player.duration);
    player.playbackRate = 1;
    await player.play().catch(() => { });
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
    } catch { }
  }
  function stopExportAudio() { try { exportAudioEl.pause(); } catch { } }

  async function pickRecorder(stream) {
    const tries = [
      { mime: "video/mp4;codecs=h264,aac" },
      { mime: "video/mp4" },
      { mime: "video/webm;codecs=vp9,opus" },
      { mime: "video/webm;codecs=vp8,opus" }
    ];

    for (const t of tries) {
      try {
        if (t.mime && MediaRecorder.isTypeSupported?.(t.mime)) {
          return {
            rec: new MediaRecorder(stream, {
              mimeType: t.mime,
              videoBitsPerSecond: 8_000_000
            }),
            mime: t.mime
          };
        }
      } catch {}
    }

    return {
      rec: new MediaRecorder(stream),
      mime: "video/webm"
    };
  }
  async function generateTV(mode) {
    const vw = player.videoWidth || 1280;
    const vh = player.videoHeight || 720;

    const format = (formatSel?.value || "original");
    const { cw, ch } = computeCanvasSize(vw, vh, format);

    if ((player.duration || 0) > MAX_SECONDS + 0.5) {
      throw new Error(tr().TooLong);
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
    await waitSeek().catch(() => { });

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { alpha: false });

    const stream = canvas.captureStream(FPS_HINT);

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

      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
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

    player.playbackRate = 1;
    await player.play().catch(() => { });
    await sleep(REC_WARMUP_MS);
    player.pause();

    const ramp = (gainNode, to) => {
      if (!gainNode || !ac) return;
      const now = ac.currentTime;
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(to, now + 0.05);
      } catch { }
    };

    const audioNormal = async (t) => {
      ramp(gainOrig, 1.0);
      ramp(gainMusic, 0.0);
      try { musicEl.pause(); } catch { }
      stopExportAudio();
      if (typeof t === "number") await startExportAudioAt(t);
    };

    const audioReplay = () => {
      ramp(gainOrig, 0.0);
      stopExportAudio();
      if (musicUrl && gainMusic && ac) {
        try { musicEl.currentTime = 0; musicEl.play().catch(() => { }); } catch { }
        ramp(gainMusic, 0.8);
      } else {
        ramp(gainMusic, 0.0);
        try { musicEl.pause(); } catch { }
      }
    };

    if (mode !== "replays") {
      setStatus("Recording original…");
      exporter.normal(); exporter.setFade(0);

      // ✅ iOS fix: evita “picos” no início do original
      const START = Math.min(0.25, Math.max(0, (player.duration || 0) - 0.3));
      player.playbackRate = 1;

      player.currentTime = START;
      await waitNear(START);
      await audioNormal(START);

      await playTo(player.duration);
      stopExportAudio();
    }

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
        await player.play().catch(() => { });
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
        try { musicEl.pause(); } catch { }
        await sleep(100);
      }
    }

    exporter.stop();
    await sleep(260);
    rec.stop();

    const blob = await new Promise(res => rec.onstop = () => res(new Blob(chunks, { type: mime })));

    try { stopExportAudio(); } catch { }
    try { if (ac) ac.close(); } catch { }

    player.muted = false;
    forceAudioOnForPreview();
    forceInlineVideo();

    generatedBlob = blob;
    generatedUrl = URL.createObjectURL(blob);
    generatedMime = mime;

    return blob;
  }

  // Railway: transcode to MP4 (WhatsApp/IG friendly)
  async function transcodeToMp4(webmBlob) {
    const fd = new FormData();
    fd.append("file", webmBlob, "input.webm");

    // ✅ FIX CRÍTICO: mandar token no transcode (senão dá "Missing token")
    const r = await fetch("/api/transcode", {
      method: "POST",
      body: fd,
      headers: {
        "x-demo-token": DEMO_TOKEN,
        "x-mrp-token": DEMO_TOKEN,
      },
    });

    if (!r.ok) {
      let msg = "Server error";
      try { msg = (await r.json())?.error || msg; } catch {}
      throw new Error(msg);
    }
    return await r.blob(); // mp4
  }

  function blobToUrl(blob) {
    return URL.createObjectURL(blob);
  }

  function downloadBlobSafe(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      try { window.open(url, "_blank", "noopener"); } catch { }
      showModal("Export tip", tr().ExportTip);
    }, 250);
  }

  async function ensureMp4Ready() {
    if (!generatedBlob || !generatedUrl) {
      throw new Error("No generated file.");
    }

    return {
      blob: generatedBlob,
      url: generatedUrl,
      mime: generatedMime || "video/mp4"
    };
  }

  async function shareFile(blob, mime, filename) {
    const file = new File([blob], filename, { type: mime });
    if (navigator.share) {
      try {
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
          return false;
        }
        await navigator.share({ title: "MyRePlayTV", text: "TV-style replay made with MyRePlayTV", files: [file] });
        return true;
      } catch (e) {
        console.warn("Share failed:", e);
        return false;
      }
    }
    return false;
  }
  if (btnDlOriginal) btnDlOriginal.onclick = () => {
    if (!originalUrl) return showModal("MyRePlayTV", "No original video.");
    downloadBlobSafe(originalUrl, `MyRePlayTV_Original_${Date.now()}.mp4`);
  };

  if (btnDlGenerated) btnDlGenerated.onclick = async () => {
    if (!generatedUrl) return showModal("MyRePlayTV", "Generate first.");
    const mode = (modeSel?.value || "full");
    const name = mode === "replays" ? "ReplaysOnly" : "OriginalPlusReplays";

    try {
      setLocked(true);
      setStatus(tr().SharePreparing);
      const out = await ensureMp4Ready();
      downloadBlobSafe(out.url, `MyRePlayTV_${name}_${Date.now()}.mp4`);
    } catch (e) {
      showModal(tr().ExportError, String(e?.message || e || "Export failed."));
    } finally {
      setLocked(false);
      enableControls(!!originalUrl);
      if (btnPreviewGenerated) btnPreviewGenerated.disabled = !generatedUrl;
      if (btnDlGenerated) btnDlGenerated.disabled = !generatedUrl;
      if (btnShareGenerated) btnShareGenerated.disabled = !generatedUrl;
      refreshUsageUI();
    }
  };

  if (btnShareGenerated)
    btnShareGenerated.onclick = async () => {
      if (!generatedUrl) return showModal("MyRePlayTV", "Generate first.");
      const mode = (modeSel?.value || "full");
      const name = mode === "replays" ? "ReplaysOnly" : "OriginalPlusReplays";

      try {
        setLocked(true);
        setStatus(tr().SharePreparing);

        const out = await ensureMp4Ready();

        // Try native share first
        const ok = await shareFile(out.blob, out.mime, `MyRePlayTV_${name}.mp4`);

        // Fallback: if share fails on iOS, do a safe download flow
        if (!ok) {
          downloadBlobSafe(out.url, `MyRePlayTV_${name}_${Date.now()}.mp4`);
        }
      } catch (e) {
        showModal(tr().ExportError, String(e?.message || e || "Share failed."));
      } finally {
        setLocked(false);
        enableControls(!!originalUrl);
        if (btnPreviewGenerated) btnPreviewGenerated.disabled = !generatedUrl;
        if (btnDlGenerated) btnDlGenerated.disabled = !generatedUrl;
        if (btnShareGenerated) btnShareGenerated.disabled = !generatedUrl;
        refreshUsageUI();
      }
    };

  // ---------- Generate ----------
  if (btnGenerate) btnGenerate.onclick = async () => {
    if (window.__MRP_LOCKED__) return;
    if (!player.duration) return showModal("MyRePlayTV", tr().NoVideo);
    if (marks.length === 0) return showModal("MyRePlayTV", tr().NeedMark);
    if ((player.duration || 0) > MAX_SECONDS + 0.5) return showModal("MyRePlayTV", tr().TooLong);

    if (isUsageBlocked()) {
      showModal(tr().UpgradeTitle, tr().UsageBlocked + "\n\n" + tr().UpgradeBody);
      return;
    }

    const mode = (modeSel?.value || "full");

    try {
      setLocked(true);
      setStatus(tr().Gen);

      clearGenerated();

      // consume 1 export BEFORE heavy work
      const ok = await consumeOneExport();
      await fetchUsage();
      refreshUsageUI();

      if (!ok) {
        showModal(tr().UpgradeTitle, tr().UsageBlocked + "\n\n" + tr().UpgradeBody);
        setStatus(tr().Ready);
        return;
      }

      // 1) Generate FAST preview in-browser (WebM)
      const webmBlob = await generateTV(mode);

      generatedWebmBlob = webmBlob;
      generatedMime = generatedMime || "video/webm";
      generatedWebmUrl = URL.createObjectURL(webmBlob);

      // Set generated as WebM (instant preview)
      generatedBlob = webmBlob;
      generatedUrl = generatedWebmUrl;

      if (btnPreviewGenerated) btnPreviewGenerated.disabled = false;
      if (btnDlGenerated) btnDlGenerated.disabled = false;
      if (btnShareGenerated) btnShareGenerated.disabled = false;

      player.pause();
      player.srcObject = null;
      player.playbackRate = 1;
      player.src = generatedUrl;
      player.controls = true;
      player.load();
      forceAudioOnForPreview();
      forceInlineVideo();
      await player.play().catch(() => { });

      setStatus(tr().Done);
    } catch (e) {
      console.error(e);
      showModal(tr().ExportError, String(e?.message || e || "Try shorter video or fewer marks."));
      setStatus(tr().Ready);
    } finally {
      setLocked(false);
      enableControls(!!originalUrl);
      if (btnPreviewGenerated) btnPreviewGenerated.disabled = !generatedUrl;
      if (btnDlGenerated) btnDlGenerated.disabled = !generatedUrl;
      if (btnShareGenerated) btnShareGenerated.disabled = !generatedUrl;
      refreshUsageUI();
    }
  };

  // ---------- Back to edit ----------
  (function addBackToEditPatch() {
    try {
      let backBtn = document.getElementById("btnBackToEdit");
      const refBtn = document.getElementById("btnPreviewGenerated") || document.getElementById("btnGenerate");

      if (!backBtn) {
        backBtn = document.createElement("button");
        backBtn.id = "btnBackToEdit";
        backBtn.className = "btn ghost";
        backBtn.textContent = tr().BackToEdit;
        backBtn.disabled = true;
        if (refBtn && refBtn.parentElement) refBtn.insertAdjacentElement("afterend", backBtn);
        else document.body.appendChild(backBtn);
      }

      const goBack = async () => {
        if (!originalUrl) return;

        try { player.pause(); } catch { }
        try { stopExportAudio(); } catch { }
        try { musicEl.pause(); } catch { }

        try { clearGenerated(); } catch { }

        marks = [];
        try { renderMarks(); } catch { }

        try {
          player.srcObject = null;
          player.playbackRate = 1;
          player.src = originalUrl;
          player.controls = true;
          player.load();
        } catch { }

        try {
          exportAudioEl.pause();
          exportAudioEl.src = originalUrl;
          exportAudioEl.load();
        } catch { }

        try { enableControls(true); } catch { }
        try { forceAudioOnForPreview(); } catch { }
        forceInlineVideo();

        if (btnPreviewGenerated) btnPreviewGenerated.disabled = true;
        if (btnDlGenerated) btnDlGenerated.disabled = true;
        if (btnShareGenerated) btnShareGenerated.disabled = true;

        backBtn.disabled = true;
        setStatus("Back to edit: Original (marks cleared)");
        player.play().catch(() => { });
      };

      backBtn.onclick = goBack;

      // Enable Back when generated exists
      const tick = () => {
        backBtn.textContent = tr().BackToEdit;
        backBtn.disabled = !generatedUrl;
      };
      setInterval(tick, 400);
    } catch (e) {
      console.warn("BackToEdit patch failed:", e);
    }
  })();

  // ---------- Start ----------
  (async function init() {
    enableControls(false);
    renderMarks();
    setStatus(tr().Ready);
    forceInlineVideo();

    await fetchUsage();
    refreshUsageUI();
  })();

  })();