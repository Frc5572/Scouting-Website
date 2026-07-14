# 5572 Scouting — Offline App Setup

This turns your scouting site into an app scouters install straight to their
phone's home screen — no App Store, no Play Store, and it works with **zero**
wifi/cell connection once installed. You keep using the QR-scan workflow to
get data onto the laptop.

## Before you deploy

1. **Drop in your real `match-data.js`** — I put a placeholder in this folder.
   Swap it for the one already in your GitHub repo.
2. **(Optional but recommended) Swap the icons** — `icons/icon-192.png`,
   `icons/icon-512.png`, and `icons/apple-touch-icon.png` are plain
   placeholders. Replace them with square PNGs of your gear logo for a nicer
   home-screen icon.
3. **(Optional) Remove the YouTube video block** if you want the page to look
   clean when offline — it's harmless to leave (it just won't load without
   wifi), but you can delete the `<div class="video-section">...</div>` block
   in `index.html` if you'd rather not have a dead video on the page.

## Hosting it (one-time, needs internet)

A service worker (what makes this installable + offline-capable) **requires
HTTPS**. The easiest zero-cost option since you already have a GitHub repo:

1. Push this whole folder's contents to your `Scouting-Website` repo (or a
   branch/folder of it).
2. In the repo: **Settings → Pages → Deploy from a branch** → pick the
   branch/folder → Save.
3. GitHub gives you a URL like `https://frc5572.github.io/Scouting-Website/`.
   That's the link every scouter opens **once** to install the app.

You could also just double-click `index.html` locally over a local wifi
network (e.g. host it with `python3 -m http.server` on the laptop and have
phones hit the laptop's IP) — but GitHub Pages means it survives even after
this event, and scouters can install it from home before ever showing up.

## Installing on iPhone (Safari)

1. Open the GitHub Pages link in **Safari** (must be Safari, not Chrome, for
   this to work on iOS).
2. Tap the **Share** icon (square with an arrow) at the bottom.
3. Scroll down, tap **Add to Home Screen**.
4. Tap **Add**. An app icon now sits on their home screen — tapping it opens
   the scouting form full-screen, no browser bar, and it'll keep working with
   airplane mode on.

## Installing on Android (Chrome)

1. Open the GitHub Pages link in **Chrome**.
2. Tap the **⋮** menu (top right).
3. Tap **Add to Home screen** (or **Install app** if Chrome offers it
   directly).
4. Confirm. Same result — a home-screen app icon, works fully offline.

## Why this satisfies "no app store, works offline"

- It's just a website "installed" via the browser's built-in home-screen
  feature — never touches the App Store or Play Store, no developer account,
  no review process.
- The **service worker** (`sw.js`) caches every file the app needs
  (`index.html`, the CSS/JS libraries, icons) the first time it's opened.
  After that, it loads instantly from the phone's local storage even in
  airplane mode.
- QR generation happens **entirely in JavaScript on the phone** — it never
  needs to reach Google. I decoupled it from the old Google Form submission
  flow so hitting "Submit" instantly shows the QR code regardless of signal.
  If the phone *does* have wifi at that moment, it'll also quietly try to log
  the entry to your Google Form in the background as a bonus, but nothing
  waits on that or breaks without it.
- Field-layout images and the YouTube embed are still pulled from ibb.co /
  YouTube, so those specific images won't load with zero connection unless a
  scouter has opened the page once with wifi (the service worker will cache
  whatever it manages to load). Everything needed to actually fill out the
  form and generate the QR code works with no exceptions offline.

## Testing offline before competition

On your phone, after installing: turn on Airplane Mode, open the app icon,
fill out a fake match, hit Submit, confirm the QR modal pops up instantly.
That's the whole test.
