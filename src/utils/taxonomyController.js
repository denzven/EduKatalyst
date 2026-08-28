/**
 * Central Taxonomy Controller
 * Manages subjects, categories, and tags dynamically across the application.
 * Zero hardcoded values — everything is dynamically aggregated, registered, and persisted.
 */

const CUSTOM_TAXONOMY_KEY = 'dzvn_custom_taxonomy';

function getStoredCustomTaxonomy() {
  try {
    const raw = localStorage.getItem(CUSTOM_TAXONOMY_KEY);
    return raw ? JSON.parse(raw) : { subjects: [], tags: [] };
  } catch (e) {
    return { subjects: [], tags: [] };
  }
}

function saveCustomTaxonomy(data) {
  try {
    localStorage.setItem(CUSTOM_TAXONOMY_KEY, JSON.stringify(data));
  } catch (e) {}
}

/**
 * Register a new custom subject dynamically
 */
export function registerSubject(newSubject) {
  if (!newSubject || !newSubject.trim()) return;
  const clean = newSubject.trim();
  const stored = getStoredCustomTaxonomy();
  if (!stored.subjects.includes(clean)) {
    stored.subjects.push(clean);
    saveCustomTaxonomy(stored);
  }
  return clean;
}

/**
 * Register a new custom tag dynamically
 */
export function registerTag(newTag) {
  if (!newTag || !newTag.trim()) return;
  const clean = newTag.trim().replace(/^#/, '');
  const stored = getStoredCustomTaxonomy();
  if (!stored.tags.includes(clean)) {
    stored.tags.push(clean);
    saveCustomTaxonomy(stored);
  }
  return clean;
}

/**
 * Aggregate all unique subjects dynamically across sessions, notes, and quizzes
 */
export function aggregateAllSubjects(sessions = [], notes = [], quizzes = []) {
  const subjectsMap = new Map();

  // Helper to increment subject count
  const addSubject = (name) => {
    if (!name) return;
    const clean = name.trim();
    const current = subjectsMap.get(clean) || 0;
    subjectsMap.set(clean, current + 1);
  };

  // 1. Add stored sessions
  sessions.forEach((s) => {
    if (s.category) addSubject(s.category);
  });

  // 2. Add markdown notes
  notes.forEach((n) => {
    if (n.subject) addSubject(n.subject);
    if (n.category && n.category !== n.subject) addSubject(n.category);
  });

  // 3. Add markdown quizzes
  quizzes.forEach((q) => {
    if (q.subject) addSubject(q.subject);
  });

  // 4. Add custom registered subjects
  const stored = getStoredCustomTaxonomy();
  stored.subjects.forEach((subj) => {
    if (!subjectsMap.has(subj)) {
      subjectsMap.set(subj, 0);
    }
  });

  const result = [];
  subjectsMap.forEach((count, name) => {
    result.push({ name, count });
  });

  return result;
}

/**
 * Aggregate all unique tags dynamically across sessions, notes, and quizzes with item counts
 */
export function aggregateAllTags(sessions = [], notes = [], quizzes = []) {
  const tagsMap = new Map();

  const addTag = (tagName) => {
    if (!tagName) return;
    const clean = tagName.trim().replace(/^#/, '');
    const current = tagsMap.get(clean) || 0;
    tagsMap.set(clean, current + 1);
  };

  sessions.forEach((s) => {
    (s.tags || []).forEach(addTag);
  });

  notes.forEach((n) => {
    (n.tags || []).forEach(addTag);
  });

  quizzes.forEach((q) => {
    (q.tags || []).forEach(addTag);
  });

  const stored = getStoredCustomTaxonomy();
  stored.tags.forEach((t) => {
    if (!tagsMap.has(t)) {
      tagsMap.set(t, 0);
    }
  });

  const result = [];
  tagsMap.forEach((count, name) => {
    result.push({ name, count });
  });

  // Sort by count descending, then alphabetically
  return result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
