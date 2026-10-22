# No More Rewatch for YouTube

A Firefox and Chrome extension that blocks YouTube videos and Shorts that you already watched.

- A video counts as watched after 30 seconds of playback, or after half of it if it is shorter.
- When you open a watched video again, an overlay covers the page and the video stops. There is no "watch anyway" button.
- You can set how many days a video stays blocked (default: forever). After you save, you can only make this longer.
- You can import your browser history, or a Google Takeout export (Chrome `BrowserHistory.json`, YouTube `watch-history.json` or `.html`).
- Works on www.youtube.com, m.youtube.com and embedded players.
- All data stays in your browser (`storage.local`). Nothing is sent anywhere.

Click the toolbar icon for the settings.

## Development

The same `extension/` folder works in both browsers (Manifest V3).
`video-id.js` sets `ext` to `browser` (Firefox) or `chrome` (Chrome).

```bash
cd extension
npx web-ext run      # start Firefox with the extension
npx web-ext lint
npx web-ext build    # zip for addons.mozilla.org and the Chrome Web Store
```

In Chrome: open `chrome://extensions`, turn on "Developer mode", click "Load unpacked", and select the `extension/` folder.
Chrome shows a warning about the unknown key `browser_specific_settings`. This is normal; Chrome ignores the key.
