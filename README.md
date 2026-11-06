# BuJón – Quiet Bullet Journal

> A capture-first, distraction-free digital translation of Ryder Carroll's *The Bullet Journal Method* (2018). Built with React 19, TypeScript, Vite, Tailwind CSS v4, Dexie.js (IndexedDB), and full PWA offline support.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)](https://web.dev/progressive-web-apps/)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB%20(Local--First)-emerald.svg)](https://dexie.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-stone.svg)](LICENSE)

---

## Philosophy & Core Principles

BuJón is designed to bring the tactile intentionality, peace, and clarity of an analogue dotted notebook into a fast, modern web and mobile application:

* **Capture-First (< 3 Seconds):** The app opens straight into Today's log with the cursor focused. No splash screens, loading banners, or modal popups slowing you down.
* **Deliberate Migration:** Incomplete tasks **never** roll over automatically. You must consciously examine each unfinished task and choose: migrate it to tomorrow (`>`), schedule it in the future log (`<`), or strike it through as irrelevant (`×`).
* **Distraction-Free ("Quiet"):** No accounts, no subscriptions, no notifications, no gamification badges, no streak counters, and no AI clutter.
* **Local-First & Offline:** All your journals live in your browser's IndexedDB via Dexie.js with WebKit 7-day eviction protection. Works completely offline with full PWA home-screen installation and JSON export/import.

---

## Features

### 1. Daily Log (`Today`)
* **Rapid Logging:** Sub-3-second capture with instant keyboard prefix parsing.
* **Drag-and-Drop Reordering:** Reorder tasks and notes within the day using intuitive drag handles, or with accessible <kbd>Alt + ↑</kbd> / <kbd>Alt + ↓</kbd> shortcuts.
* **Mobile Swipe Gestures:** Natural horizontal touch swiping on mobile (swipe left for tomorrow, swipe right for yesterday).
* **Date Navigation:** Seamlessly jump between days with arrow keys or a date picker.

### 2. Monthly Log (`Month`)
* **Dual-Column Analogue Layout:** 
  * Left: Date-by-date calendar timeline (1–31) with recorded events (`○`).
  * Right: Monthly task focus and priority list.
* **Uncompleted Task Tracker:** Highlights open tasks requiring review before the month closes.

### 3. Guided Monthly Review Engine
* **Step-by-Step Triage:** Presents one uncompleted task at a time for conscious contemplation:
  * **Migrate to Next Month (`>`)**: Spawns a linked task in the new month preserving origin lineage.
  * **Schedule to Future Log (`<`)**: Defers into an upcoming month in the Future Log.
  * **Strike Out (`×`)**: Declares the task no longer worth your time or effort.
  * **Skip for now**: Leaves the task open for later reflection.
* Shows a final summary breakdown upon completion.

### 4. Future Log (`Future`)
* **Multi-Month Timeline:** 6-month annual overview grouped strictly by upcoming months (`YYYY-MM`).
* **Direct Scheduling:** Add scheduled tasks (`<`) and scheduled events (`○`) directly into future months.
* Quick one-click jump into any monthly log.

### 5. Collections & Lists (`Collections`)
* **Pinned Inbox:** Dedicated top container for unassigned fleeting captures and quick braindumps.
* **Custom Thematic Lists:** Create custom collections (e.g. *Books to Read*, *Project Ideas*, *Packing List*).
* Filter and triage collection items directly into daily logs.

### 6. Search & Dynamic Index (`Index`)
* Instant full-text search replacing the physical paper notebook Index.
* Filter segmented tabs: All, Tasks (`•`), Events (`○`), Notes (`—`), Priority (`*`), Ideas (`!`), Open, Completed (`✕`), and Migrated (`>`).

### 7. Max-5 Undo History
* State changes and strikes can be reversed step-by-step up to 5 actions via the **Undo** button or <kbd>Ctrl + Z</kbd> / <kbd>Cmd + Z</kbd>.

### 8. Mobile-Ready & PWA Installable
* **Thumb Navigation:** Dedicated bottom tab bar on mobile screens (< 768px) with 44px+ hitboxes.
* **Installable:** Standards-compliant Web App Manifest, auto-updating service worker, and iOS Safari installation guide.

---

## Rapid Syntax Guide

Type in the capture bar using traditional Bullet Journal prefixes:

| Prefix | Symbol | Description | Example |
| :--- | :---: | :--- | :--- |
| *(default)* or `. ` | `•` | **Task** | `Call supplier` or `. Call supplier` |
| `o ` or `O ` | `○` | **Event** | `o Design sync at 2pm` |
| `- ` | `—` | **Note** | `- Subtraction creates mental clarity` |
| `* ` | `* •` | **Priority Signifier** | `* Finish architecture blueprint` |
| `! ` | `! •` | **Inspiration Signifier** | `! Novel interaction idea` |

### Keyboard & Tap Interactions

| Interaction | Action |
| :--- | :--- |
| **Click Bullet** or <kbd>Ctrl + Enter</kbd> | Toggle Completed (`✕`) $\leftrightarrow$ Open (`•`) |
| **Double Click Bullet** or <kbd>Ctrl + Backspace</kbd> | Strike out as irrelevant (`—` with strikethrough) |
| **Right-Click / Long-Press** or <kbd>Ctrl + M</kbd> | Open Deliberate Move/Migration Sheet |
| <kbd>Alt + ↑</kbd> / <kbd>Alt + ↓</kbd> | Move entry up or down (reorder) |
| <kbd>Ctrl + Z</kbd> / <kbd>Cmd + Z</kbd> | Undo last state change (up to 5 steps) |
| <kbd>/</kbd> | Focus capture input from anywhere |
| **Swipe Left / Right** *(mobile)* | Flip between Tomorrow and Yesterday |

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/) or [bun](https://bun.sh/)

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/bujon.git
cd bujon

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Open your browser at `http://localhost:3000` (or the port displayed in your terminal).

### Building for Production

```bash
# Build production bundle with Vite and PWA service worker precaching
npm run build

# Preview the production build locally
npm run preview
```

---

## Installing on Mobile Devices (PWA)

### iOS (iPhone / iPad)
1. Open the app in **Safari**.
2. Tap the **Share** button in the Safari toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. BuJón will launch full-screen like a native app.

### Android / Chrome / Edge
1. Open the app in Chrome or Edge.
2. Tap the **Install** button in the top navigation bar (or select *Install app* from the browser menu).
3. Confirm installation to add BuJón to your home screen or app drawer.

---

## Built-In Testing & Specification Suite

BuJón includes an interactive in-app verification runner based on the core acceptance test checklist:

1. Click **"Test & Guide"** in the top navigation bar.
2. In the modal:
   - **Load Realistic Demo Journal:** One-click pre-population with daily logs, events, future entries, and collections.
   - **Export JSON Backup:** Download timestamped backups (`bujon-backup-YYYY-MM-DD.json`).
   - **Restore JSON:** Restore or migrate data between devices without cloud reliance.
   - **Automated Spec Runner:** Click **Run Test Suite** to run live transactional assertions validating syntax parsing, state transitions, 5-step undo limits, migration origin linking, order persistence, and PWA capabilities.

---

## Tech Stack

* **Framework:** React 19, TypeScript
* **Build System:** Vite 8
* **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
* **Storage:** Dexie.js (IndexedDB wrapper)
* **PWA & Offline:** `vite-plugin-pwa`, Workbox
* **Icons:** `lucide-react`
* **Typography:** Newsreader (display serif), DM Sans (body), JetBrains Mono (symbols & data)

---

## Data Privacy & Sovereignty

* **Zero Tracking:** No telemetry, analytics, or external trackers are loaded.
* **100% Client-Side:** Your data never leaves your device unless you explicitly export a JSON backup.
* **Portability:** Export all entries, logs, and collections at any time as structured JSON.

---

## License

Distributed under the **Apache-2.0 License**. See [LICENSE](LICENSE) for details.
