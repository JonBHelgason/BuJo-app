# BuJón Mobile-Ready & PWA Implementation Plan

Elevate the BuJón Bullet Journal web app into a high-grade mobile touch application and installable Progressive Web App (PWA) with thumb-zone navigation, horizontal day swiping, and offline home screen support.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following mobile-readiness choices have been aligned with your preferences:
> - **PWA Installation & Offline Support**: Configured with Web App Manifest, offline service worker caching, and an in-app installation prompt with iOS Safari guidance.
> - **Horizontal Day Swiping**: Touch gesture detection on the Daily Log canvas enabling natural left/right swipes to move between yesterday, today, and tomorrow.
> - **Mobile Navigation (Thumb Ergonomics)**: An ergonomic fixed bottom tab bar on mobile viewports (< 768px) with 44px+ hitboxes, seamlessly transitioning to the desktop top-bar on wider screens.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms the digital bullet journal into an app that feels like a native iOS/Android experience: installable to the phone's home screen without browser chrome, navigable with single-handed thumb taps, and responsive to horizontal swipe gestures to flip between journal days.
- **Target Audience**: Mobile-first Bullet Journal practitioners who need sub-3-second capture on their phones while on the go, without distractions, accounts, or cloud dependency.
- **Key Value**: The tactile, quiet intimacy of paper journaling combined with the instant accessibility of an offline mobile app.

---

### 2. User Experience & Visual Design

Following the **Mobile & Touch-First Applications Design Reference** (`10_mobile_touch_apps.md`):

#### A. Mobile Thumb-Zone Navigation (Viewport < 768px)
- **Fixed Bottom Tab Bar**: Anchored to the bottom (`fixed bottom-0 z-30 pb-safe`) with 5 core tabs: **Today**, **Month**, **Future**, **Collections**, and **Index**.
- **Touch Target Ergonomics**: Every tab icon and button has a minimum hitbox of **44 × 44px** to eliminate mis-taps.
- **Responsive Preservation**: On desktop (`md:` and above), the clean Top Bar Contract header remains the primary navigation, hiding the mobile bottom bar.
- **Capture Bar Placement**: On mobile, the rapid capture bar rests immediately above the bottom tab bar, ensuring the input and bullet symbol remain directly in the natural thumb reach zone (bottom 40% of the screen).

#### B. Natural Horizontal Day Swiping
- **Touch Gesture Engine**: Smooth touch start/move/end listener with touch distance and velocity detection (`minSwipeDistance = 50px`, horizontal angle constraint to prevent accidental triggers while scrolling vertically).
- **Tactile Transition**: Swiping left advances to tomorrow; swiping right flips to yesterday.
- **Visual Feedback**: Micro slide transition effect to communicate directional movement.

#### C. Full PWA Installability
- **In-App Install Prompt**: A clean install action (`Install App` or `Add to Home Screen`) in the header and testing modal.
- **iOS Safari Guide Modal**: A dedicated sheet showing iOS users how to tap the Safari Share button and select "Add to Home Screen".
- **Standalone Mode Awareness**: Automatically suppresses install prompts when running standalone from the home screen.
- **Offline Reliability Indicator**: Non-intrusive status banner indicating local IndexedDB caching is active during offline usage.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Mobile Bottom Tab Bar vs Top Navigation**
  - *Chosen Approach*: Adaptive split: Dedicated bottom tab bar on mobile screens (< 768px), top bar on tablets and desktop (≥ 768px).
  - *Why*: Modern phones (375px–430px) require bottom-weighted touch targets to reduce thumb fatigue.
  - *Alternatives Considered*: Hamburger drawer (adds unnecessary extra taps) or top horizontal scroll (hard to reach one-handed).

- **Decision 2: Native Touch Swipe vs Third-Party Gesture Library**
  - *Chosen Approach*: Lightweight native React pointer/touch event handler for horizontal swiping.
  - *Why*: Zero bundle bloat, zero dependency conflicts, smooth 60fps gesture handling with proper vertical scroll isolation (`Math.abs(deltaX) > Math.abs(deltaY)`).

- **Decision 3: PWA Architecture (`vite-plugin-pwa`)**
  - *Chosen Approach*: Integrate `vite-plugin-pwa` with `registerType: 'autoUpdate'`, standalone manifest, and runtime font caching.
  - *Why*: Provides standards-compliant Web App Manifest, auto-updating service worker, and instant offline boot.

---

### 4. Technical Architecture & Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                 Top App Bar (Desktop & Mobile)             │
│  [BuJón]                 [Undo] [Theme] [Install] [Test]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Active View Area                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  DailyLog View (Swipeable Canvas: swipe left/right)   │  │
│  │  - Day header & stats                                 │  │
│  │  - Interactive Entry rows (drag, tap, cycle, strike)  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│         Rapid Capture Bar (Anchored in Thumb Zone)          │
│  [Log ▾] [•] [Type entry here...]                [Add ↵]   │
├─────────────────────────────────────────────────────────────┤
│      Mobile Bottom Tab Bar (Visible on Viewports < 768px)   │
│   [Today]     [Month]     [Future]   [Collections]  [Index] │
└─────────────────────────────────────────────────────────────┘
```

#### Key Implementation Steps:
1. **PWA Tooling & Manifest**:
   - Install `vite-plugin-pwa` as a dev dependency.
   - Configure `vite.config.ts` with manifest metadata (`id: '/'`, `display: 'standalone'`, theme colors, icons, offline workbox caching).
   - Add Apple mobile web app and mobile meta tags in `index.html`.
   - Create brand PWA SVG and PNG icon representations in `public/`.
2. **PWA Install Hook & iOS Guide**:
   - Create `src/hooks/usePWAInstall.ts` handling `beforeinstallprompt`, `appinstalled`, and iOS WebKit detection.
   - Add install triggers in `TopNav.tsx` and `TestVerificationModal.tsx`.
3. **Mobile Bottom Tab Bar**:
   - Create `src/components/MobileBottomNav.tsx` with 44px+ hitboxes, active indicator pills, and safe-area insets.
4. **Touch Swipe Gesture Integration**:
   - Implement horizontal swipe detection in `src/views/DailyLog.tsx` with smooth day switching.
5. **Layout Adjustment**:
   - Adjust bottom spacing (`pb-28 sm:pb-24`) so entries and the capture input never collide with mobile safe areas or the bottom navigation bar.
