# EduKatalyst — Content Publishing & Catalog Manifest Architecture

> **Static Manifest Discovery & Cloud Content Sync**  
> **Utilities**: `googleDriveSync.js`, `googleDriveStreamer.js`, `githubSync.js`

---

## 1. Content Manifest Architecture (`public/manifest.json`)

To eliminate latency and Google Drive API rate-limiting during course catalog browsing, EduKatalyst uses a **Static Content Manifest Architecture**.

On application boot, the SPA fetches a single static `public/manifest.json` asset:

```json
{
  "version": "2026.09.01",
  "generatedAt": "2026-09-01T20:00:00Z",
  "subjects": ["Physics", "Mathematics", "Computer Science"],
  "sessions": [
    {
      "id": "vid_qm_01",
      "title": "Quantum Mechanics Lecture 1",
      "category": "Physics",
      "tags": ["quantum", "physics"],
      "playlistUrl": "https://drive.google.com/uc?export=download&id=FILE_ID_M3U8"
    }
  ]
}
```

---

## 2. Google Drive Content Distribution Model

- **Public Content Store**: Master course archives, notes, and public HLS stream packages are stored in a dedicated Google Drive folder `"EduKatalyst Storage"`.
- **Direct Link Access**: Student browsers fetch public media assets directly via CORS-enabled Google Drive download endpoints (`https://drive.google.com/uc?export=download&id=...`).
- **User Backup Storage**: Students can export local IndexedDB sessions into packaged Zip bundles (`exportSessionToZip()`) or upload personal backups to their own Google Drive or GitHub Gist.

---

## 3. Trusted Publishing Pipeline

To publish new course content to the master public catalog without embedding administrative credentials in the client app:

1. **Authoring**: Creator builds notes, quizzes, or videos in Creator Studio.
2. **Commit / Release**: Creator exports the static content bundle and pushes a git tag or commit to GitHub.
3. **GitHub Actions Execution**: GitHub Actions CI/CD pipeline runs with repository secret `GOOGLE_MASTER_REFRESH_TOKEN`, uploads assets to Google Drive, regenerates `public/manifest.json`, and deploys the updated static site to GitHub Pages.
