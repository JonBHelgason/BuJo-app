# Method 2 Implementation Plan: Automated Native Android APK Builder

Build a standalone, native Android application (`.apk`) using Capacitor and an automated GitHub Actions workflow, allowing direct installation onto any Android phone without local developer tooling.

## User Review & Critical Decisions

> [!IMPORTANT]
> You selected **Method 2 (Automated Native Android APK)**. 
> Every git push will trigger a GitHub runner that builds a real `app-debug.apk` file and attaches it to your GitHub Actions artifacts and Releases, ready to download and install on your phone.

- **App Package Name**: `com.bujo.app`
- **App Display Name**: `BuJón`
- **Output Artifact**: `bujo-app-debug.apk` (Downloadable directly from GitHub on your phone)
- **Local Tooling Required**: Zero. GitHub's cloud runners will execute Gradle and the Android SDK.

---

## 1. Overview & Architecture

```
┌────────────────────────────────────────────────────────┐
│ 1. Git Push / Manual Trigger                           │
│    User pushes commits to GitHub (jonbhelgason/bujo-app)│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. GitHub Actions Cloud Runner (Ubuntu)                │
│    - Node 22 + Java JDK 17 (Temurin)                   │
│    - `npm install --legacy-peer-deps`                  │
│    - `npm run build` (Builds production assets)        │
│    - `npx cap sync android` (Copies assets to Android) │
│    - `./gradlew assembleDebug` (Compiles APK)          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Downloadable Artifact & GitHub Release              │
│    - `bujo-app-debug.apk` produced                     │
│    - Uploaded to GitHub Actions Artifacts              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. Android Phone Installation                          │
│    - Open GitHub on phone browser                      │
│    - Download and tap `bujo-app-debug.apk`             │
│    - Tap "Install" -> Opens full-screen from App Drawer│
└────────────────────────────────────────────────────────┘
```

---

## 2. Key Changes & Files to Create

### 1. Capacitor Setup & Configuration
- **Dependencies**: Install `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
- **`capacitor.config.ts`**:
  - `appId`: `'com.bujo.app'`
  - `appName`: `'BuJón'`
  - `webDir`: `'dist'`
  - `server`: `{ androidScheme: 'https' }` (ensures modern IndexedDB/Dexie storage compatibility on Android WebViews).

### 2. Android Native Project Structure (`/android`)
- Run `npx cap add android` to generate:
  - `android/app/src/main/AndroidManifest.xml` (app permissions, orientation, and launch config).
  - `android/app/build.gradle` and root `android/build.gradle`.
  - Gradle wrapper (`gradlew` and `gradle/wrapper/gradle-wrapper.properties`).
  - Native Android launcher icon assets generated from the BuJón theme icon.

### 3. Automated GitHub Actions Workflow (`.github/workflows/build-apk.yml`)
- Create a dedicated workflow that:
  - Checks out the repository.
  - Sets up Java 17 (`actions/setup-java@v4` with `distribution: 'temurin'`).
  - Sets up Node 22 (`actions/setup-node@v4`).
  - Installs dependencies and runs `npm run build` with `VITE_BASE=/` (for native packaged assets).
  - Synchronizes web assets with `npx cap sync android`.
  - Runs `./gradlew assembleDebug` with appropriate execution permissions (`chmod +x gradlew`).
  - Uploads the resulting `.apk` file (`android/app/build/outputs/apk/debug/app-debug.apk`) as an easily downloadable artifact named `bujo-android-apk`.

### 4. Android Safe-Area & Viewport Tweaks
- Ensure top and bottom safe-area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) prevent content from overlapping the Android status bar and gesture navigation pill.
- Ensure the offline IndexedDB database functions flawlessly inside the native Android WebView.

### 5. Documentation (`README.md`)
- Add a clear "Installing on Android" section with step-by-step instructions:
  1. Go to the **Actions** tab in `jonbhelgason/bujo-app`.
  2. Click the latest green workflow run.
  3. Scroll down to **Artifacts** and download `bujo-android-apk`.
  4. Open the downloaded `.apk` file and tap **Install**.

---

## 3. Product & Technical Decisions

- **Debug APK vs. Signed Release APK**:
  - *Chosen Approach*: Build an `assembleDebug` APK.
  - *Why*: Debug APKs can be sideloaded and installed immediately on any Android phone without needing to create or manage secret cryptographic keystores (`.keystore` files).
- **Webview Scheme**:
  - *Chosen Approach*: `androidScheme: 'https'`.
  - *Why*: Modern Android WebViews require HTTPS origins to allow IndexedDB and modern Web APIs without security sandboxing restrictions.

---

## 4. Verification & Testing Plan

1. Verify local web build compiles cleanly with `npm run build` and `tsc --noEmit`.
2. Verify Capacitor config parses properly with `npx cap sync android`.
3. Verify Gradle configuration files are syntactically valid and gradlew script is executable.
4. Verify GitHub workflow file syntax.
