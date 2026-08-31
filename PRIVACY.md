# Privacy Policy for EduKatalyst

**Effective Date:** August 31, 2026

EduKatalyst ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your information is handled when you use the EduKatalyst web application.

---

## 1. Local-First Data Architecture
EduKatalyst is designed as a local-first single-page application.
- All course materials, AES-128 encrypted HLS video streams, Markdown notes, bookmarks, and quiz progress are stored locally inside your browser's IndexedDB and localStorage.
- We do **not** collect, store, track, sell, or transmit any user telemetry, personal data, or usage logs to external proprietary servers.

---

## 2. Google Drive & GitHub Integrations
When you choose to use Cloud Sync features (Google Drive Sync or GitHub Gist Sync):
- **Direct API Communication**: Your browser communicates directly with Google APIs (`https://www.googleapis.com`) or GitHub APIs (`https://api.github.com`) using official OAuth 2.0 authorization tokens.
- **Data Scope**: We only request access to the minimal required scope (`https://www.googleapis.com/auth/drive.file`) to manage backup files inside a dedicated `"EduKatalyst Storage"` folder on your Google Drive.
- **No Proxy Servers**: Your OAuth tokens and backup data remain strictly client-side and are never transmitted to or processed by any intermediate servers.

---

## 3. Storage & Security
- Access tokens and Client IDs are saved locally in your browser's `localStorage` and can be removed at any time by clicking "Sign Out" or clearing browser storage.

---

## 4. Contact & Support
If you have any questions regarding this Privacy Policy, please open an issue on our official GitHub repository:
- **Repository:** [https://github.com/denzven/EduKatalyst](https://github.com/denzven/EduKatalyst)
- **Email:** edukatalyst.dzvn@gmail.com
