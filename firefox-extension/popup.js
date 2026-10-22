const $ = (id) => document.getElementById(id);

async function showCount() {
  const all = await browser.storage.local.get(null);
  $("count").textContent = Object.keys(all).filter((k) => k.startsWith("w:")).length;
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

// Imports run in a tab (popup.html?tab): the file picker and the permission prompt close the popup.
if (location.search === "?tab") {
  $("openTab").hidden = true;
  $("importSection").hidden = false;
}
$("openImport").onclick = () => {
  browser.tabs.create({ url: browser.runtime.getURL("popup.html?tab") });
  window.close();
};

$("import").onclick = async () => {
  // history is an optional permission, so the install prompt does not ask for it. Request it first, inside the click.
  if (!(await browser.permissions.request({ permissions: ["history"] }))) {
    $("status").textContent = "Import cancelled: history access was not allowed.";
    return;
  }
  $("status").textContent = "Importing…";
  // ponytail: history only tells us a visit happened, not how long; every visited video URL counts as watched.
  const items = await browser.history.search({ text: "youtube", startTime: 0, maxResults: 1e6 });
  const found = new Map();
  for (const { url, lastVisitTime } of items) remember(found, videoIdFromUrl(url), lastVisitTime);
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
        remember(found, videoIdFromUrl(url), ts);
      }
      Object.values(node).forEach(walk);
    };
    walk(JSON.parse(text));
  } catch {
    // ponytail: no timestamps in plain text/HTML, so these count as watched now.
    for (const m of text.matchAll(/https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:watch\?|shorts\/)[^\s"'<>]+/g)) {
      remember(found, videoIdFromUrl(m[0].replaceAll("&amp;", "&")), Date.now());
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
