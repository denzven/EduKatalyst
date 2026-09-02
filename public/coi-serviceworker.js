/*! coi-serviceworker v0.1.7 - Guido Zufolo (MIT License) */
/**
 * Service Worker script to inject COOP (Cross-Origin-Opener-Policy) and COEP (Cross-Origin-Embedder-Policy)
 * response headers on static hosts like GitHub Pages to enable SharedArrayBuffer multithreading.
 */
(() => {
  const coepCredentialless = true;

  if (typeof window === 'undefined') {
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener('fetch', (event) => {
      if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
        return;
      }

      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.status === 0) return response;

            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
            newHeaders.set(
              'Cross-Origin-Embedder-Policy',
              coepCredentialless ? 'credentialless' : 'require-corp'
            );

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders
            });
          })
          .catch((e) => console.error('[COI SW] Fetch error:', e))
      );
    });

  } else {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./coi-serviceworker.js').catch((err) => {
        console.warn('[COI SW] Service worker registration failed:', err);
      });
    }
  }
})();
