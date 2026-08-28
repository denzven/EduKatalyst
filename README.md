# EduKatalyst by DZVN

> **"Katalyze the Change"**  
> *By students. For students.*

**EduKatalyst** is a grounded, distraction-free educational platform for engineering undergraduates. It provides client-side **AES-128 encrypted HLS video lectures**, dynamic **raw Markdown derivation blueprints**, protected **self-assessment quizzes**, **Framer Motion spring physics animations**, and **1-click static site bundle deployment** for GitHub Pages.

---

## 🌟 Key Features

### 🔒 Client-Side AES-128 HLS Video Encrypter
- **In-Browser WASM Transcoding:** Powered by `@ffmpeg/ffmpeg` 0.12 WASM for browser-side video chunking.
- **AES-128 Encryption:** Web Crypto API 16-byte key generation and HLS `output.m3u8` playlist generation.
- **4-Second Segment Chunking:** Splits video into 4-second `.ts` transport stream chunks stored directly in IndexedDB.
- **Execution Monitor Terminal:** Real-time log terminal displaying WASM transcoding progress and chunk metrics.

### 📄 100% Dynamic Markdown Content Engine
- **Raw `.md` Dynamic Glob Loading:** Automatically discovers notes and quizzes using Vite glob dynamic imports (`import.meta.glob('/src/content/**/*.md')`).
- **Zero Hardcoding:** Subjects, tags, exam callout tips, and math formulas are parsed on-the-fly from YAML frontmatter metadata.
- **Derivation Blueprint Rendering:** Supports math formula blocks (`f(x) = ax^2 + bx + c`), callout boxes, and syntax-highlighted code.

### 🛡️ Anti-Cheat Speed Breakers & DevTools Detection
- **Dimension Delta Monitoring:** Detects open browser Developer Tools by tracking window dimension deltas (`outerWidth - innerWidth > 160`).
- **Timing Loop Shield:** Executes `debugger` timing loops to freeze inspect sessions and display a Security Shield Overlay.
- **Keyboard Shortcut Blocker:** Disables right-click context menu, `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, and `Ctrl+Shift+U`.

### 🗂️ OS Desktop Folder Box Grid Explorer
- **Desktop Box Layout:** Displays course subjects as interactive desktop folder tiles with live item counters.
- **Breadcrumb Navigation:** Real-time pathing (`Storage > Root > Subject > #tag`).
- **Central Taxonomy Controller:** Centralized registry aggregating subject folders and tag classifiers across lectures, notes, and quizzes.

### 🔗 Client-Side Hash Router & Deep Linking
- **100% Static GitHub Pages Routes:**
  - `/#/` — Academic Preloader & Landing Page
  - `/#/explorer` — Master OS File Explorer
  - `/#/explorer?subject=General` — Direct link into a subject directory
  - `/#/lessons` — Encrypted Video Lectures feed
  - `/#/notes` — Markdown Notes feed
  - `/#/notes?id=sample-note` — Direct deep link to a specific note
  - `/#/quizzes` — Self-Assessment Quizzes feed
  - `/#/studio` — Password-protected Creator Studio Modal
- **Browser History Integration:** Syncs `popstate` and `hashchange` listeners so browser Back and Forward buttons navigate seamlessly.
- **1-Click Share Link:** Copies exact deep link URLs directly to the clipboard.

### ⚡ Framer Motion & Canvas Confetti
- **Physics-Based Spring Gestures:** Smooth 3D scale and hover dynamics (`framer-motion`).
- **Viewport Scroll Triggers:** `whileInView` scroll-triggered slide-up entrance animations (`viewport={{ once: true }}`).
- **Portal Tab Switch Cross-Fades:** `AnimatePresence mode="wait"` view transitions between tabs.
- **Celebration Reward Feedback:** Triggers celebratory particle bursts (`canvas-confetti`) upon completing assessment quiz questions.

### 🔒 Password-Protected Creator Studio
- **Access Password:** `"Test123"` (salted SHA-256 client-side authentication).
- **Authoring Suite:** Includes Lecture Encrypter, Markdown Notes Publisher, Assessment Quiz Author, and Taxonomy Controller.
- **Static Zip Export & Import:** Exports packaged `.zip` archives containing playlist files, encrypted segments, and encryption keys ready for static deployment on GitHub Pages.

---

## 🛠️ Technology Stack

- **Core UI:** React 19, Vite 8, TailwindCSS v4
- **Typography:** Plus Jakarta Sans (Headings), Inter (UI/Body), JetBrains Mono (Math/Code)
- **Icons:** Lucide React
- **Animations:** Framer Motion, Canvas Confetti
- **Video Engine:** `@ffmpeg/ffmpeg` 0.12 WASM, `hls.js`, Web Crypto API
- **Storage & Bundling:** IndexedDB, JSZip
- **PWA & Offline:** Vite Plugin PWA, Workbox

---

## 📁 Directory Architecture

```
d:/DZVN_edutech_test/
├── public/
│   ├── favicon.svg             # Custom vector Katalyst Logo favicon
│   └── manifest.webmanifest    # PWA Webmanifest
├── src/
│   ├── components/
│   │   ├── ContactCard.jsx     # Standard academic contact & support card
│   │   ├── DevStudioModal.jsx  # Creator Studio password challenge modal
│   │   ├── FolderExplorer.jsx  # OS Desktop Folder Box Grid Explorer
│   │   ├── Header.jsx          # Top navbar header with Katalyst Logo & Studio button
│   │   ├── KatalystLogo.jsx    # Custom vector Katalyst SVG Logo component
│   │   ├── LandingPage.jsx     # High-impact academic hero landing page
│   │   ├── MobileBottomNav.jsx # Mobile navigation bar
│   │   ├── Preloader.jsx       # Initial app boot preloader screen
│   │   ├── StudentPortal.jsx   # Main portal tab container (Explorer, Lectures, Notes, Quizzes)
│   │   ├── StudioNotesManager.jsx # Markdown notes & quizzes authoring studio
│   │   ├── TaxonomyManager.jsx # Dynamic subject & tag taxonomy controller
│   │   ├── VideoPlayer.jsx     # Encrypted HLS video player player
│   │   └── VideoUploader.jsx   # WASM video encrypter & execution monitor
│   ├── content/
│   │   ├── notes/              # Raw .md markdown notes
│   │   └── quizzes/            # Raw .md markdown quizzes
│   ├── utils/
│   │   ├── antiCheat.js        # DevTools detection & keyboard blockers
│   │   ├── auth.js             # Salted SHA-256 password authentication
│   │   ├── contentEncryption.js# AES-128 GCM notes & quiz state encrypter
│   │   ├── ffmpegHelper.js     # FFmpeg WASM 0.12 video chunker
│   │   ├── markdownParser.js   # Raw .md frontmatter parser & glob loader
│   │   ├── router.js           # Client-side URL Hash Router & query parser
│   │   ├── storage.js          # IndexedDB video session persistence
│   │   ├── taxonomyController.js# Dynamic taxonomy aggregator
│   │   └── zipHelper.js        # JSZip static bundle exporter/importer
│   ├── App.jsx                 # Root application component
│   ├── index.css               # TailwindCSS rules & keyframe micro-animations
│   └── main.jsx                # Application entry point
├── index.html                  # SEO Open Graph, Twitter Cards, & JSON-LD schema
└── package.json
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18.0 or higher
- npm 9.0 or higher

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/dzvn/edukatalyst.git
   cd edukatalyst
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build Production Bundle:**
   ```bash
   npm run build
   ```

---

## 🔐 Creator Studio Access

- **Access Point:** Click the **Studio** button in the top-right navbar header or footer, or navigate directly to `/#/studio`.
- **Default Password:** `Test123`

---

## 📄 License & Attribution

Built with ❤️ by **DZVN Tech**.  
*Katalyze the Change • By students. For students.*
