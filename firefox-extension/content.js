// One storage key per video ("w:<id>") so lookups and writes never race on a shared list.
const THRESHOLD_SECONDS = 30;
const THRESHOLD_FRACTION = 0.5;

let currentId = null; // video on this page
let blocked = false;
let marked = false;
let played = 0; // seconds actually played, so seeks and leftover time from the previous video do not count
let lastTime = null;

const idFromUrl = () => videoIdFromUrl(location.href); // video-id.js

async function check() {
  const id = idFromUrl();
  if (id === currentId) return;
  currentId = id;
  blocked = false;
  marked = false;
  played = 0;
  lastTime = null;
  removeOverlay();
  if (!id) return;
  const key = "w:" + id;
  const got = await browser.storage.local.get({ [key]: 0, blockDays: 0 });
  // blockDays 0 = block forever. After the block expires the video counts as new and is marked again when watched.
  const active = got[key] && (!got.blockDays || Date.now() - got[key] < got.blockDays * 86400000);
  if (active && idFromUrl() === id) {
    blocked = true;
    showOverlay();
  }
}

document.addEventListener("yt-navigate-finish", check);
// ponytail: m.youtube.com does not fire yt-navigate-finish, so also poll the URL. check() returns early when the ID did not change.
setInterval(check, 1000);
check();

// timeupdate and play do not bubble, so listen in the capture phase.
document.addEventListener("timeupdate", (e) => {
  const v = e.target;
  // Shorts preload the next videos in paused players; only the playing one counts.
  if (v.paused || !currentId || blocked || marked || document.querySelector(".ad-showing")) return;
  if (lastTime !== null) {
    const delta = v.currentTime - lastTime;
    if (delta > 0 && delta < 2) played += delta;
  }
  lastTime = v.currentTime;
  if (played >= THRESHOLD_SECONDS || (v.duration && played >= v.duration * THRESHOLD_FRACTION)) {
    marked = true;
    browser.storage.local.set({ ["w:" + currentId]: Date.now() });
  }
}, true);

document.addEventListener("play", (e) => { if (blocked) e.target.pause(); }, true);

function showOverlay() {
  document.querySelectorAll("video").forEach((v) => v.pause());
  const o = document.createElement("div");
  o.id = "ytw-overlay";
  o.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.92);color:#fff;" +
    "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font:20px sans-serif";
  o.innerHTML = "<div>You already watched this video.</div>";
  // In an embedded player, "Go back" would navigate the page that embeds it, so leave the button out there.
  if (window === window.top) {
    const back = document.createElement("button");
    back.textContent = "Go back";
    back.onclick = () => (history.length > 1 ? history.back() : (location.href = location.origin + "/"));
    back.style.cssText = "font:16px sans-serif;padding:8px 16px;cursor:pointer";
    o.append(back);
  }
  (document.body || document.documentElement).append(o);
}

function removeOverlay() {
  document.getElementById("ytw-overlay")?.remove();
}
