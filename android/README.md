# Foundation English — Android APK (offline book)

This Android shell bundles the exact **45-page stable static Student Book** (`index.html`, `style.css`, `logo.svg` and verified audio manifest/files) into an installable Android package. **All lessons, vocabulary cards, quizzes, Arabic dictionary, images and navigation work without an internet connection.** It does not rebuild pages dynamically.

## Key technical choices

- Native Android Java WebView shell, Android API 24+, AndroidX WebViewAssetLoader, app-local HTTPS-like origin for safe JavaScript / localStorage.
- The existing letter progress and quiz persistence remain in localStorage within Android WebView.
- The HTML, CSS, and app assets are copied automatically **from the GitHub repository at APK build time**; no duplicate content source to maintain.
- External old A–C MP3 URLs are still used when the phone is online; when missing/offline they fall back to Android TextToSpeech (en-US, the available voice depends on the device).
- No guarantee of a male recorded US voice until the pending audio library has actually been generated.
- Verified locally hosted MP3s in `audio/files/` are bundled automatically for future builds.
- APK has Internet permission for existing legacy audio only; no external site is required for the book itself.
- Android hardware Back button turns to previous page and closes from the cover; existing Next/Previous and quiz/touch navigation remain unchanged.
- `file://` and unsafe mixed-content paths are not enabled, and non-local top-level links open in a separate browser.
- The APK uses a simple built-in book icon; it does not redistribute the original logo font or require new imagery.

## Build the installable APK

Open **GitHub → Actions → Build Foundation English Android APK**, select the successful build run, and download the **Foundation-English-APK** artifact. GitHub packages the resulting `app-debug.apk` inside a ZIP artifact.

Local build requires Android SDK Platform 35, Build Tools 35.0.0, JDK 17, and Gradle 8.11.1:

```sh
gradle -p android --no-daemon :app:assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Install on Android

1. Download the ZIP from the successful GitHub Actions run and extract `app-debug.apk`.
2. Move the APK to your Android phone and tap to install. Allow installation from that file manager/browser when Android asks.
3. Launch **Foundation English**. Content pages work offline. If audio recording URLs fail while offline, the Android device's built-in US-English TTS is used if available and enabled.
4. Note that Android may warn that the app is from outside Google Play because this is a development/testing build.

**Release/security**: The GitHub Actions artifact is an auto-signed *debug* APK intended for sideload testing, **not** a signed production release or a Play Store AAB. Production distribution later requires a persistent, user-owned release signing key, testing on actual physical Android devices, and a versioning/update policy. Never commit signing keystores or passwords.

## Regression and distribution safeguards

- Building runs structural book tests, builds the Android package and verifies that the APK contains all 45 pages and local book files.
- The normal GitHub Pages deployment workflow and the stable web branch are unchanged.
- Offline and audio behaviors require device acceptance testing; Chromium emulation tests of the website do not automatically validate the native Android shell.
