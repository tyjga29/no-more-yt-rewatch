# addons.mozilla.org listing text

Copy each part into the matching field on the AMO "Describe Add-on" page.
The description field accepts Markdown (bold, lists, links, code).

---

**Name:** No More Rewatch for YouTube

**Summary (max 250 characters):**
Stops you from watching the same YouTube videos and Shorts again. A video you already watched is blocked with a full-page overlay. No "watch anyway" button.

**Category:** Social & Communication

**License:** MIT

**Homepage:** https://github.com/tyjga29/no-more-yt-rewatch

**Support site:** https://github.com/tyjga29/no-more-yt-rewatch/issues

---

## Description

Do you open the same YouTube videos again and again? No More Rewatch remembers each video and Short that you watched. When you open one of them again, the extension covers the page and stops the video. There is no "watch anyway" button.

**Features**

- Blocks normal videos, Shorts, live streams and embedded YouTube players on other websites.
- Works on www.youtube.com and m.youtube.com.
- Block watched videos for a number of days, or forever. After you save the duration, you can only make it longer.
- Import the videos you watched before you installed the extension: from your Firefox history, or from a Google Takeout export of your Chrome history or YouTube watch history.
- All data stays in your browser. The extension sends no data anywhere.

**How to use it**

Click the snake icon in the toolbar. The popup shows how many videos are stored and lets you set the block duration. Click "Import history…" to open the import page in a new tab.

---

### Technical details

**When a video counts as watched**

- A video counts as watched after 30 seconds of real playback, or after half of its length if that comes first. For a 40-second Short, this is 20 seconds.
- Only real playback counts. The extension adds the time between two playback updates only when that time is between 0 and 2 seconds. Thus a skip forward, a skip back or a loop does not count.
- Ads do not count. While YouTube shows an ad, the extension stops counting.
- Paused players do not count. The Shorts page loads the next videos in the background; only the video that plays counts.

**Which pages are blocked**

The extension finds the video ID in these URL forms:

- `youtube.com/watch?v=<id>`
- `youtube.com/shorts/<id>`
- `youtube.com/live/<id>`
- `youtube.com/embed/<id>` and `youtube-nocookie.com/embed/<id>` (embedded players on other websites)

YouTube changes pages without a full reload. The extension listens for YouTube's `yt-navigate-finish` event and also compares the URL once per second, because the mobile site does not send that event.

**What the block does**

- A full-page overlay covers YouTube and every video on the page stops. If a video tries to start again, the extension stops it.
- The overlay has one button, "Go back". In an embedded player, the overlay covers only the player and has no button, because "Go back" would move the whole website back.
- When the block duration ends for a video, the video counts as new. If you watch it again, the extension stores a new date and the block starts again.

**Block duration**

- Before the first save, the block is forever.
- At the first save, you can choose any number of days. 0 means forever.
- After that, the extension accepts only a longer duration. Forever is the longest, so when you choose it, you cannot change it again.

**Import**

- **Firefox history:** the extension searches your full history for YouTube URLs. Each video that you opened counts as watched, with the date of your last visit. Firefox history does not record how long you watched, so a short visit also counts.
- **Chrome history** (Google Takeout, `Chrome/BrowserHistory.json`): uses the URL and visit time of each entry.
- **YouTube watch history** (Google Takeout, `YouTube/history/watch-history.json`): uses the video URL and watch time of each entry.
- **Other files** (for example `watch-history.html`): the extension finds all YouTube video URLs in the text. These files have no dates that the extension can read, so the import date is used.
- If a video is already stored, the import keeps the newer date. An import never shortens a block.

**Storage**

- Data is in `browser.storage.local`. It does not sync between devices.
- Each video is one entry: the key is `w:<video ID>` and the value is the date when you watched it (milliseconds since 1970). The block duration is in the entry `blockDays`.
- The `unlimitedStorage` permission removes the size limit, so a large history import fits.

**Permissions**

- **Access your data for youtube.com, m.youtube.com and youtube-nocookie.com:** to find the video ID, measure playback and show the overlay. The extension does not read or change other parts of these pages.
- **Storage / unlimited storage:** to keep the list of watched videos.
- **Browsing history (optional):** the extension asks for this permission only when you click "Import from Firefox history". It uses it only to find YouTube video URLs. If you do not import, the extension never asks for it.

**Privacy**

The extension does not send network requests, has no analytics and no tracking, and declares no data collection. The source code is on GitHub (MIT license). There is no build step, so the code in the add-on is the same as the code on GitHub.

**Known limits**

- By default, Firefox does not run extensions in private windows. To block videos there, open `about:addons`, select the extension, and set "Run in Private Windows" to "Allow".
- music.youtube.com and other browsers are not blocked.
- You cannot remove one video from the list, and you cannot export the list.
- The extension uses YouTube's page structure. If YouTube changes it, the extension may stop working until an update is available.

---

**Notes to reviewer:**
No build step; the uploaded files are the source (https://github.com/tyjga29/no-more-yt-rewatch, folder `firefox-extension/`). The optional "history" permission is requested only when the user clicks "Import from Firefox history" on the import page, and is used only to find YouTube video URLs in the history. All data is stored only in storage.local. The extension makes no network requests.
