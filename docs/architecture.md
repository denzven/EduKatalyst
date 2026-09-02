# EduKatalyst — System Architecture & Engineering Principles

> **Architecture Overview & Implementation Guide**  
> **Deployment Host:** GitHub Pages (Static Hosting)  
> **Target Platform:** Web Browsers (Desktop & Mobile PWA)

---

## 1. Primary Principles

- **Obvious Over Clever**: Code must optimize for readability, maintainability, and simplicity over complex abstractions.
- **Serverless & Static Hosting**: The platform is built as a static Single Page Application (SPA) deployed to GitHub Pages. Zero always-on backend servers or SQL databases.
- **Secret Isolation**: All bundled client JavaScript is public. Zero private secrets, refresh tokens, or client secrets may be included in Vite client environment variables or JavaScript source code.
- **Browser-First Operations**: Heavy operations (video playback, Markdown rendering, encrypted IndexedDB storage, PWA caching) execute locally via browser-native APIs.

---

## 2. Layered Component Architecture

```
                                  ┌───────────────────────────┐
                                  │   GitHub Pages Host       │
                                  │ (Static Assets: dist/)    │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Browser Runtime                                      │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                               UI Layer (React 19)                              │   │
│   │   (App, StudentPortal, DevStudioModal, VideoPlayer, StudioNotesManager)        │   │
│   └───────────────────────────────────────┬────────────────────────────────────────┘   │
│                                           │                                            │
│   ┌───────────────────────────────────────▼────────────────────────────────────────┐   │
│   │                         Core State & Event Mediator                            │   │
│   │               (AppShellContext, ModuleRegistry, EventMediator)                 │   │
│   └───────────────────────────────────────┬────────────────────────────────────────┘   │
│                                           │                                            │
│   ┌───────────────────────────────────────▼────────────────────────────────────────┐   │
│   │                        Domain Services & Utilities                             │   │
│   │     (storage.js, markdownParser.js, contentEncryption.js, zipHelper.js)        │   │
│   └───────────────────────────────────────┬────────────────────────────────────────┘   │
│                                           │                                            │
│   ┌───────────────────────────────────────▼────────────────────────────────────────┐   │
│   │                       Browser-Native Storage & Crypto                          │   │
│   │        (IndexedDB EncryptedVideoDB, Web Crypto AES-GCM, CacheStorage)          │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          ┌─────────────────────┐                       ┌─────────────────────┐
          │  Google Drive API   │                       │   GitHub Actions    │
          │ (Public Content &   │                       │ (Trusted CI/CD for  │
          │   User Backups)     │                       │ Master Publishing)  │
          └─────────────────────┘                       └─────────────────────┘
```

---

## 3. Data Flow & Subsystems

### A. Static Content Discovery
1. SPA boots and fetches static `public/manifest.json` in 1 HTTP request.
2. `AppShellContext` loads available subjects, notes, and quizzes into local state.
3. No Google Drive REST search calls required for catalog browsing.

### B. Video Transcoding & Playback
- **Authoring**: Creator uses `VideoUploader.jsx` with `@ffmpeg/ffmpeg` WASM to convert uploaded video into HLS `.m3u8` playlist and 4-second `.ts` segments.
- **Playback**: Student browser streams `.m3u8` and `.ts` chunks directly using `hls.js`. No student-side WASM overhead.

### C. Local Persistence & Quota Management
- Binary segment blobs and metadata persist locally in IndexedDB (`EncryptedVideoDB`).
- `storage.js` requests persistent storage via `navigator.storage.persist()` and evicts old video chunks using an LRU (Least Recently Used) cache policy when disk usage exceeds the threshold.

---

## 4. Security Boundaries

1. **Public Client Code**: Assume attackers can inspect all client JavaScript, local storage, and network requests.
2. **DOMPurify Sanitization**: All compiled Markdown HTML must pass through `DOMPurify.sanitize()` before being passed to `dangerouslySetInnerHTML`.
3. **Privileged Operations**: Official master content uploads and Drive sync operations must execute through GitHub Actions secrets or user-owned Google OAuth 2.0 PKCE authentication.
