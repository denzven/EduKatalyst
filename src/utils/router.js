/**
 * Lightweight Client-Side Hash Router
 * Parses and updates window.location.hash for static GitHub Pages compatibility.
 * 
 * Routes:
 * - /#/ (Root path -> Landing Page)
 * - /#/landing (Landing Page)
 * - /#/explorer (File Explorer tab)
 * - /#/explorer?subject=General
 * - /#/lessons
 * - /#/notes
 * - /#/notes?id=sample-note
 * - /#/quizzes
 * - /#/studio
 */

export function parseHash() {
  const hash = window.location.hash || '#/landing';
  const cleanHash = hash.replace(/^#\/?/, '');
  const [routePath, queryString] = cleanHash.split('?');

  const tab = !routePath || routePath === 'landing' ? 'landing' : routePath;
  const params = {};

  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return { tab, params };
}

export function navigateTo(tab, params = {}) {
  let hashStr = `#/${tab}`;

  const queryParts = [];
  Object.keys(params).forEach((key) => {
    if (params[key] && params[key] !== 'All') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    }
  });

  if (queryParts.length > 0) {
    hashStr += `?${queryParts.join('&')}`;
  }

  if (window.location.hash !== hashStr) {
    window.location.hash = hashStr;
  }
}

export function subscribeToHash(callback) {
  const handleHashChange = () => {
    callback(parseHash());
  };

  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}
