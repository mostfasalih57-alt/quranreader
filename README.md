# Quran Reader for Ray-Ban Meta Display

A plain HTML/CSS/JS web app (no build step, no accounts, no Meta developer registration) that shows the
original 13-line Quran pages (854 pages) from the Qamar Apps ebook site.

Files: `index.html` (the reader), `style.css`, `app.js`, `config.js` (page URLs), `test.html` (self-test).

## 1. Test on your computer (2 minutes)

You need Python (already on macOS/Linux; on Windows install from python.org or use `py`).

```
cd quran-reader
python3 -m http.server 8000        # Windows: py -m http.server 8000
```

1. Open http://localhost:8000/test.html
   - Every "Page image" line should say **OK**. The embed box should show the original page.
   - If images say FAILED, the original site is blocking pictures from other sites. See "If images fail" below.
2. Open http://localhost:8000/index.html and try the buttons.

Desktop-only shortcuts: PageUp/PageDown = previous/next, + / - / 0 = zoom, g = go-to-page, Tab/Enter = move/press.

## 2. Put it online (free HTTPS)

**GitHub Pages (permanent link):**
1. Create a free account at github.com, then **New repository** named `quran-reader` (Public).
2. **Add file → Upload files**, drag in all files from this folder (not the folder itself), **Commit changes**.
3. **Settings → Pages**, Source: **Deploy from a branch**, Branch: **main** / **(root)**, Save.
4. After a minute your site is at `https://YOUR-USERNAME.github.io/quran-reader/`.

**Quicker alternative:** drag the folder onto https://app.netlify.com/drop. Menu names on these sites change
occasionally, so follow what the screen shows.

## 3. Add to the glasses

In the Meta AI app, add the web app by URL (you already have Developer Mode on) using:
`https://YOUR-USERNAME.github.io/quran-reader/index.html`

Open `.../test.html` on the glasses once first. It reports the screen size, whether storage works,
and whether the page images load there.

## How the controls work

- The glasses move focus between on-screen buttons and press the focused one. The app uses ordinary
  buttons and does not hijack arrow keys. Focused buttons turn white with a yellow ring.
- Bottom row: **Prev, Next, − (zoom out), + (zoom in), Fit (reset zoom), Go**.
- When zoomed, a second row of arrows (◀ ▲ ▼ ▶) pans the page. Touch/scroll also works.
- **Go** opens page selection (use the −100…+100 buttons, or press **Type number** to enter one), plus
  *Night colours* (inverts the page to light-on-black, default on) and *Viewer* (page images vs. original viewer).
- Your last-read page is saved automatically and restored when you reopen the app.

## If images fail

- Press **Use original viewer** on the error screen (or *Viewer* in the Go panel). This embeds the site's own
  basic viewer page. Zoom there uses the site's controls, and its own next/prev links won't update this app's
  page counter.
- If both fail, the site doesn't allow use from other websites. Please contact the site owner for permission
  before copying their page images to your own hosting; this app does not copy them.

## If the site ever changes

Edit `config.js`: `imageUrls` (tried in order; the original uses .jpg for pages 1-3 and .png from page 4) and
`viewerUrl` use `{nnnn}` (page padded to 4 digits) and `{n}`.
