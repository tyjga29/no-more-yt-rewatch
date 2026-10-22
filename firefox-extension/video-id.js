// Shared by content.js and popup.js.
// Returns the video ID of a YouTube watch, Shorts, live or embed URL, else null.
function videoIdFromUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname)) return null;
  if (u.pathname === "/watch") return u.searchParams.get("v");
  return u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1] ?? null;
}
