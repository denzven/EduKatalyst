/**
 * GitHub REST Service
 * Centralized service managing GitHub REST API & Gist operations for client-side backups.
 */

const GITHUB_TOKEN_KEY = 'katalyst_github_pat';
const GITHUB_REPO_KEY = 'katalyst_github_repo';

/**
 * Retrieve saved GitHub Personal Access Token
 */
export function getStoredGitHubToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
}

/**
 * Save or remove GitHub Personal Access Token
 */
export function setStoredGitHubToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
    console.info('[GitHub] Personal Access Token saved');
  } else {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    console.info('[GitHub] Personal Access Token cleared');
  }
}

/**
 * Retrieve target repo setting e.g. "owner/repo"
 */
export function getStoredGitHubRepo() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GITHUB_REPO_KEY) || '';
}

/**
 * Save target repo setting
 */
export function setStoredGitHubRepo(repo) {
  if (typeof window === 'undefined') return;
  if (repo) {
    localStorage.setItem(GITHUB_REPO_KEY, repo.trim());
  } else {
    localStorage.removeItem(GITHUB_REPO_KEY);
  }
}

/**
 * Validate a GitHub Personal Access Token
 */
export async function validateGitHubToken(token) {
  const tokenToUse = (token || getStoredGitHubToken()).trim();
  if (!tokenToUse) {
    throw new Error('No GitHub token provided.');
  }

  try {
    console.info('[GitHub] Validating Personal Access Token');
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid GitHub token or expired credentials.');
      }
      throw new Error(`GitHub API Error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    console.info('[GitHub] Token validated for user:', data.login);
    return {
      login: data.login,
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      htmlUrl: data.html_url,
    };
  } catch (error) {
    console.error('[GitHub] Error validating GitHub token:', error);
    throw error;
  }
}

/**
 * Backup / Export a single video session or full database metadata to a GitHub Gist
 */
export async function exportToGitHubGist(sessionOrData, isPublic = false, description = '') {
  const token = getStoredGitHubToken();
  if (!token) {
    throw new Error('Please configure a GitHub Personal Access Token first.');
  }

  const payload = {
    description: description || `EduKatalyst Session Backup: ${sessionOrData.title || 'Data Bundle'}`,
    public: isPublic,
    files: {
      'katalyst_session_metadata.json': {
        content: JSON.stringify(sessionOrData, null, 2),
      },
    },
  };

  try {
    console.info('[GitHub] Creating session backup Gist');
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gist Creation Failed: ${err.message || response.statusText}`);
    }

    const gist = await response.json();
    console.info('[GitHub] Gist created successfully:', gist.id);
    return {
      id: gist.id,
      htmlUrl: gist.html_url,
      rawUrl: gist.files['katalyst_session_metadata.json']?.raw_url,
      createdAt: gist.created_at,
    };
  } catch (error) {
    console.error('[GitHub] Error exporting to Gist:', error);
    throw error;
  }
}

/**
 * Fetch and import session metadata from a GitHub Gist ID or URL
 */
export async function importFromGitHubGist(gistIdOrUrl) {
  let gistId = (gistIdOrUrl || '').trim();
  if (gistId.includes('github.com')) {
    const parts = gistId.split('/');
    gistId = parts[parts.length - 1];
  }

  const token = getStoredGitHubToken();
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.info('[GitHub] Fetching Gist session metadata:', gistId);
    const response = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch Gist (${response.status}): ${response.statusText}`);
    }

    const gist = await response.json();
    const targetFile = gist.files['katalyst_session_metadata.json'] || Object.values(gist.files)[0];

    if (!targetFile || !targetFile.content) {
      throw new Error('No valid session metadata content found in this Gist.');
    }

    return JSON.parse(targetFile.content);
  } catch (error) {
    console.error('[GitHub] Error importing from Gist:', error);
    throw error;
  }
}

/**
 * List all EduKatalyst Gists created by the user
 */
export async function listUserGists() {
  const token = getStoredGitHubToken();
  if (!token) return [];

  try {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return [];

    const gists = await response.json();
    return gists
      .filter((g) => g.description && g.description.toLowerCase().includes('edukatalyst'))
      .map((g) => ({
        id: g.id,
        description: g.description,
        htmlUrl: g.html_url,
        updatedAt: g.updated_at,
        files: Object.keys(g.files),
      }));
  } catch (error) {
    console.error('[GitHub] Error listing user Gists:', error);
    return [];
  }
}
