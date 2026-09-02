# EduKatalyst — Local Development & Build Guide

> **Developer Setup, Build Commands, & Workflows**  
> **Host Target:** Static GitHub Pages  
> **Build Tool:** Vite 8 + React 19 + TailwindCSS v4

---

## 1. Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **Browser**: Modern Chromium, Firefox, or Safari with Web Crypto API and IndexedDB support.

---

## 2. Local Setup & Commands

### Clone Repository & Install Dependencies
```bash
git clone https://github.com/denzven/EduKatalyst.git
cd EduKatalyst
npm install
```

### Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Build Production Static Assets
```bash
npm run build
```
Generates static assets in `./dist/` ready for static hosting.

### Preview Production Build Locally
```bash
npm run preview
```
Previews the compiled static bundle in `./dist/`.

---

## 3. Environment Variables & Secret Isolation Rules

Environment variables consumed by Vite MUST use the `VITE_` prefix and are **100% PUBLIC**.

```env
# Safe Public Variables (.env / .env.example)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### ⚠️ CRITICAL SECRET ISOLATION RULES
1. **NEVER** put client secrets, master refresh tokens, or private credentials in `.env`, `.env.local`, or source files.
2. **NEVER** commit `.env.local` to git version control.
3. Master publishing refresh tokens belong exclusively in **GitHub Actions Secrets** (`GOOGLE_MASTER_REFRESH_TOKEN`).

---

## 4. GitHub Pages Deployment

- Static deployment is automated via GitHub Actions in [.github/workflows/deploy.yml](file:///d:/DZVN_edutech_test/.github/workflows/deploy.yml).
- Pushing to the `main` branch builds `./dist` and deploys static assets to GitHub Pages.
- Client routing uses hash routing (`/#/`) to ensure deep links work without 404 errors on static hosts.
