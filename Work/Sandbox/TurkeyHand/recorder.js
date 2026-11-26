// Record the canvas plus the mixed audio stream (gobbles + mic), up to
// MAX_SECONDS. Hold the button to record while held, or tap to start and tap
// again to stop; the time cap catches anyone who forgets. Then preview the
// clip with Download and links for sharing the filter itself.
//
// No website can post a video straight to Instagram or TikTok; on phones the
// native share sheet (navigator.share) is the route to those apps. The link
// buttons share the page, which is how new people find the filter. Instagram
// and TikTok have no web "share a link" intent either, so those two copy the
// caption + link and open the site/app for the user to paste it.

const MAX_SECONDS = 30;
const HOLD_MS = 400; // presses longer than this are hold-to-record; shorter ones toggle

const PAGE_URL = "https://www.highdimensionalcoconuts.com/Work/Sandbox/TurkeyHand/";
const SHARE_TEXT = "Happy Thanksgiving! 🦃 I turned my hand into a turkey. Make your own:";
const enc = encodeURIComponent;
const SOCIAL = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
  x: `https://x.com/intent/tweet?text=${enc(SHARE_TEXT)}&url=${enc(PAGE_URL)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(PAGE_URL)}`,
  bluesky: `https://bsky.app/intent/compose?text=${enc(SHARE_TEXT + " " + PAGE_URL)}`,
};
const PASTE_ONLY = { instagram: "Instagram", tiktok: "TikTok" };

// MP4 first: it's what iMessage, WhatsApp, etc. play everywhere. Safari only
// records MP4; Chrome records MP4 since v126, WebM before that.
const TYPES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export function initRecording({ canvas, audioStream, button, sheet, onHint }) {
  const mime = window.MediaRecorder && TYPES.find((t) => MediaRecorder.isTypeSupported(t));
  if (!mime || !canvas.captureStream) {
    button.hidden = true;
    return;
  }
  const stream = new MediaStream([
    ...canvas.captureStream(30).getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ]);

  let rec = null, startedAt = 0, raf = 0, pressing = false;

  function onDown(e) {
    if (!sheet.hidden) return;
    e.preventDefault();
    if (rec) { stop(); return; } // the second tap of tap-to-record
    button.setPointerCapture?.(e.pointerId);
    pressing = true;
    start();
  }

  function onUp() {
    if (!pressing) return;
    pressing = false;
    if (!rec) return;
    if (performance.now() - startedAt >= HOLD_MS) stop();
    else onHint("Recording — tap again to stop");
  }

  function start() {
    const chunks = [];
    const r = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    r.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
    r.onstop = () => showClip(new Blob(chunks, { type: (r.mimeType || mime).split(";")[0] }));
    r.start(250);
    rec = r;
    startedAt = performance.now();
    button.classList.add("recording");
    tick();
  }

  function stop() {
    if (!rec) return;
    rec.stop();
    rec = null;
    cancelAnimationFrame(raf);
    button.classList.remove("recording");
    button.style.setProperty("--progress", 0);
  }

  function tick() {
    const t = (performance.now() - startedAt) / 1000;
    button.style.setProperty("--progress", Math.min(1, t / MAX_SECONDS));
    if (t >= MAX_SECONDS) { stop(); return; }
    raf = requestAnimationFrame(tick);
  }

  button.addEventListener("pointerdown", onDown);
  button.addEventListener("pointerup", onUp);
  button.addEventListener("pointercancel", () => { if (pressing) { pressing = false; stop(); } });
  button.addEventListener("contextmenu", (e) => e.preventDefault()); // iOS long-press menu

  // --- preview sheet ---
  const player = sheet.querySelector("video");
  const shareBtn = sheet.querySelector("[data-share]");
  const saveLink = sheet.querySelector("[data-save]");
  const closeBtn = sheet.querySelector("[data-close]");
  const body = sheet.querySelector(".sheet-body");
  const hint = sheet.querySelector("[data-hint]");
  const copyBtn = sheet.querySelector("[data-copy]");
  let file = null;

  for (const a of sheet.querySelectorAll("[data-social]")) {
    a.href = SOCIAL[a.dataset.social];
    const app = PASTE_ONLY[a.dataset.social];
    if (!app) continue;
    // Don't preventDefault: the link still opens (in the app, on phones).
    a.addEventListener("click", () => {
      navigator.clipboard.writeText(`${SHARE_TEXT} ${PAGE_URL}`).then(
        () => { hint.textContent = `Caption + link copied — paste it into your ${app} post or story`; },
        () => { hint.textContent = `Add this link to your ${app} post: ${PAGE_URL}`; });
    });
  }

  function showClip(blob) {
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    file = new File([blob], `hand-turkey.${ext}`, { type: blob.type });
    const url = URL.createObjectURL(blob);
    player.src = url;
    saveLink.href = url;
    saveLink.download = file.name;
    // The OS share sheet is the only way a web page can hand the video itself
    // to Instagram/TikTok on phones; shown only where it supports files.
    shareBtn.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
    hint.textContent = "";
    sheet.hidden = false;
    player.play().catch(() => {});
  }

  shareBtn.addEventListener("click", async () => {
    try {
      // The link goes in the text: some apps drop `url` when files are attached.
      await navigator.share({ files: [file], title: "Happy Thanksgiving!", text: `${SHARE_TEXT} ${PAGE_URL}` });
    } catch (err) {
      if (err.name !== "AbortError") hint.textContent = "Couldn't share — try Download instead";
    }
  });

  const copyLabel = copyBtn.querySelector("span");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(PAGE_URL);
      copyLabel.textContent = "Copied!";
    } catch {
      copyLabel.textContent = "Couldn't copy";
    }
    setTimeout(() => { copyLabel.textContent = "Copy link"; }, 1500);
  });

  function closeSheet() {
    if (sheet.hidden) return;
    player.pause();
    URL.revokeObjectURL(player.src);
    player.removeAttribute("src");
    file = null;
    sheet.hidden = true;
  }
  closeBtn.addEventListener("click", closeSheet);
  // Modal convention: a tap outside the preview and buttons dismisses it.
  sheet.addEventListener("click", (e) => { if (!body.contains(e.target)) closeSheet(); });
}
