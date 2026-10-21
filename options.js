const $ = (id) => document.getElementById(id);

async function showCount() {
  const all = await browser.storage.local.get(null);
  $("count").textContent = Object.keys(all).filter((k) => k.startsWith("w:")).length;
}

function videoId(url) {
  try {
    const u = new URL(url);
    return u.hostname.endsWith("youtube.com") && u.pathname === "/watch" ? u.searchParams.get("v") : null;
  } catch {
    return null;
  }
}

// found: Map<id, timestamp>. Keeps the newest timestamp, also against what is already stored.
async function save(found) {
  const keys = [...found.keys()].map((id) => "w:" + id);
  const existing = await browser.storage.local.get(keys);
  const add = {};
  for (const [id, ts] of found) add["w:" + id] = Math.max(ts, existing["w:" + id] || 0);
  await browser.storage.local.set(add);
  $("status").textContent = `Imported ${found.size} videos.`;
  showCount();
}

function remember(found, id, ts) {
  if (id) found.set(id, Math.max(ts || 0, found.get(id) || 0));
}

$("import").onclick = async () => {
  $("status").textContent = "Importing…";
  // ponytail: history only tells us a visit happened, not how long; every visited watch URL counts as watched.
  const items = await browser.history.search({ text: "youtube.com/watch", startTime: 0, maxResults: 1e6 });
  const found = new Map();
  for (const { url, lastVisitTime } of items) remember(found, videoId(url), lastVisitTime);
  save(found);
};

// Chrome "BrowserHistory.json": {"Browser History":[{url, time_usec}]}.
// YouTube "watch-history.json": [{titleUrl, time}]. Anything else: scan the raw text for watch URLs.
$("file").onchange = async () => {
  const file = $("file").files[0];
  if (!file) return;
  $("status").textContent = "Importing…";
  const text = await file.text();
  const found = new Map();
  try {
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object") return;
      const url = node.url || node.titleUrl;
      if (typeof url === "string") {
        const ts = node.time_usec ? node.time_usec / 1000 : Date.parse(node.time) || Date.now();
        remember(found, videoId(url), ts);
      }
      Object.values(node).forEach(walk);
    };
    walk(JSON.parse(text));
  } catch {
    // ponytail: no timestamps in plain text/HTML, so these count as watched now.
    for (const m of text.matchAll(/https?:\/\/(?:www\.)?youtube\.com\/watch\?[^\s"'<>]+/g)) {
      remember(found, videoId(m[0].replaceAll("&amp;", "&")), Date.now());
    }
  }
  $("file").value = "";
  save(found);
};

// Not saved yet = forever (content.js treats a missing value as 0), but the first save may pick any value.
// 0 = forever is the longest possible block, so after that nothing is longer.
const isLonger = (want, current) => current === undefined || (current !== 0 && (want === 0 || want >= current));

browser.storage.local.get("blockDays").then(({ blockDays }) => {
  if (blockDays !== undefined) $("days").value = blockDays;
});
$("saveDays").onclick = async () => {
  const { blockDays } = await browser.storage.local.get("blockDays");
  const want = Math.max(0, Math.floor(Number($("days").value) || 0));
  if (!isLonger(want, blockDays)) {
    $("days").value = blockDays;
    $("saved").textContent = blockDays === 0 ? "The block is forever. You cannot change it." : `You can only make it longer than ${blockDays} days.`;
    return;
  }
  $("days").value = want;
  await browser.storage.local.set({ blockDays: want });
  $("saved").textContent = "Saved.";
};

showCount();
