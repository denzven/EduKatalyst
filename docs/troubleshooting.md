# EduKatalyst — Developer Troubleshooting & FAQ

> **Common Development, Build, CORS, and Storage Issues**

---

## 1. SharedArrayBuffer / COOP & COEP Headers Error

### Symptom
Console error during `@ffmpeg/ffmpeg` initialization: `SharedArrayBuffer is not defined` or `Cross-Origin Isolation required`.

### Cause
Multithreaded FFmpeg WASM requires Cross-Origin Isolation response headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`), which static hosts like GitHub Pages do not send natively.

### Solution
- In local development, headers are served via [vite.config.js](file:///d:/DZVN_edutech_test/vite.config.js#L37-L46).
- For static GitHub Pages deployment, include `coi-serviceworker` script in `index.html` OR use a single-threaded FFmpeg WASM build.

---

## 2. Google OAuth `origin_mismatch` or Error 400/403

### Symptom
Google login popup fails with `400: origin_mismatch` or `403: access_denied`.

### Cause
- `origin_mismatch`: The current URL domain (e.g. `http://localhost:5173` or `https://username.github.io`) is missing from "Authorized JavaScript origins" in Google Cloud Console.
- `access_denied`: OAuth App consent status is set to "Testing" and user email is not listed under Test Users.

### Solution
Add exact domain origin to Google Cloud Console Credentials and list authorized test emails under OAuth Consent Screen settings.

---

## 3. Browser IndexedDB Storage Full / Quota Error

### Symptom
Video upload or Zip import fails with `QuotaExceededError` or `DOMException`.

### Cause
Browser IndexedDB has reached the origin storage limit (typically 500 MB–2 GB).

### Solution
Open Creator Studio -> Library, delete unwatched offline video sessions, or trigger LRU cache cleanup via `enforceVideoCacheLimit()`.
