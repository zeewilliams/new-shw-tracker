# SHW Legacy — Family Reunion Payment Tracker
### Stewart · Hicks · Williams · Thanksgiving 2026

A mobile-first PWA (Progressive Web App) for tracking family reunion payments. Built with glassmorphism design, installable on iPhone, and saves automatically to your device.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page structure and HTML |
| `styles.css` | All styling — glassmorphism theme, animations, mobile layout |
| `app.js` | All JavaScript — payment logic, localStorage, modals, copy message |
| `README.md` | This file |

---

## Features

- **Payment tracking** — mark fully paid, add partial payments, undo mistakes
- **Clickable stat cards** — tap Collected, In Hand, Shortfall, or Fully Paid for a full breakdown
- **Overview popup** — full financial picture in one tap
- **Copy reminder** — generates a ready-to-send iMessage with balances and deadline
- **Editable deadline** — defaults to Sep 25, 2026 with live countdown
- **Auto-save** — saves to localStorage on every change, plus on app switch and exit
- **PWA** — installable on iPhone home screen, runs full screen

---

## Deploying to GitHub Pages

1. Push all 4 files to your GitHub repository
2. Go to **Settings → Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select **main** branch, **/ (root)** folder
5. Click **Save**
6. Your live URL will be: `https://YOUR-USERNAME.github.io/REPO-NAME/`

---

## Installing on iPhone as PWA

1. Open the GitHub Pages URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share button** (box with arrow at the bottom)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it **SHW Tracker** and tap **Add**
5. The app opens full screen with no browser bar, just like a native app

---

## Payment Data

All 20 paying adults · 12 children · 1 teenager (I'Mari)

| House | Check-in | Check-out | Cost |
|-------|----------|-----------|------|
| House A | Nov 23, 2026 | Nov 27, 2026 | $3,089.91 |
| House B | Nov 24, 2026 | Nov 27, 2026 | $2,293.32 |
| **Total** | | | **$5,383.23** |

- Per adult: **$270**
- Deposits already paid: **$1,076.66**
- Surplus if all pay: **$36.77**

---

## Tech Stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no dependencies
- Google Fonts (Playfair Display) for the SHW branding
- `localStorage` for persistent data storage
- CSS `backdrop-filter` for glassmorphism effects
- PWA manifest generated dynamically in `app.js`

---

*Stewart · Hicks · Williams · 2026*
