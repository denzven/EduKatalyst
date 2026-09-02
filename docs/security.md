# EduKatalyst — Security Architecture & Threat Model

> **Security Boundaries, DOMPurify Sanitization, & Secret Isolation**  
> **Model:** Serverless Static SPA on GitHub Pages

---

## 1. Security Model & Trust Boundaries

Because EduKatalyst is hosted as a static Single Page Application (SPA) on GitHub Pages, **all client-side JavaScript, environment variables starting with `VITE_`, local storage, and IndexedDB contents are 100% PUBLIC.**

### Threat Boundaries Matrix

| Boundary / Asset | Trust Level | Security Boundary / Protection Mechanism |
| :--- | :--- | :--- |
| **Vite Client Bundle (`dist/`)** | Public | Contains zero secrets. `VITE_GOOGLE_CLIENT_ID` is public. |
| **Client Passcode Auth (`auth.js`)** | UI Protection | Cosmetic UI unlock only. Does NOT grant trusted cloud write access. |
| **Markdown Compiler (`markdownParser.js`)**| Untrusted Input | **DOMPurify Sanitization** strips scripts, iframes, and inline event handlers. |
| **AES-128 HLS Encrypted Video** | Casual Protection | Prevents simple `<video src="...">` downloads. Not commercial DRM. |
| **Master Cloud Uploads** | Trusted Boundary | Performed via **GitHub Actions Secrets** or user-owned OAuth 2.0 PKCE. |

---

## 2. Markdown & XSS Sanitization Rules

Any Markdown content converted into HTML and rendered via React's `dangerouslySetInnerHTML` MUST pass through `DOMPurify.sanitize()`.

### 🚫 STRICT SANITIZATION RULE
- **NEVER ALLOW INLINE EVENT HANDLERS** (e.g. `onclick`, `onload`, `onerror`).
- Inline event handlers in HTML strings allow malicious XSS script execution.
- `DOMPurify` configuration MUST strip all inline event attributes:

```javascript
import DOMPurify from 'dompurify';

export function compileMarkdown(markdownText) {
  if (!markdownText) return '';
  const rawHtml = convertMarkdownToHtml(markdownText);

  // DOMPurify strips script tags and dangerous attributes like onclick
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'span', 'div', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'img', 'video', 'source'],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'href', 'target', 'controls', 'preload']
    // NOTE: 'onclick' is explicitly EXCLUDED from allowed attributes!
  });
}
```

---

## 3. Anti-Cheat & DevTools Detection Boundaries

- Functions in [antiCheat.js](file:///d:/DZVN_edutech_test/src/utils/antiCheat.js) (detecting window dimension deltas or blocking `F12`) provide **cosmetic deterrence** only.
- Client-side JavaScript execution can be inspected, frozen, or modified by a user.
- **Never claim client-side anti-cheat provides real security boundaries.**

---

## 4. Secret Management & GitHub Actions

- **Local Development**: Personal Google access tokens must be obtained via OAuth consent flow in the browser.
- **Master Publishing**: Master course library publishing to Google Drive is executed by GitHub Actions CI/CD workflows using repository secret `GOOGLE_MASTER_REFRESH_TOKEN`.
