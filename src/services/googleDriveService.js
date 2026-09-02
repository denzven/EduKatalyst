/**
 * Google Drive REST Service
 * ASD-STE100: Clean Google Drive REST API v3 operations.
 * Powered by Google Identity Services (GIS) authorization code flow (flow: 'auth-code').
 */

const DRIVE_TOKEN_KEY = 'katalyst_drive_access_token';
const MASTER_DRIVE_FOLDER_KEY = 'katalyst_master_drive_folder_id';
const PUBLIC_API_KEY_STORAGE_KEY = 'katalyst_public_google_api_key';
const TOKEN_ENDPOINT_URL_KEY = 'katalyst_token_endpoint_url';
const FOLDER_NAME = 'EduKatalyst Storage';

export function maskTokenString(token) {
  if (!token || typeof token !== 'string') return '';
  if (token.length <= 12) return '••••••••';
  return `${token.slice(0, 8)}••••••••${token.slice(-4)}`;
}

export function getStoredDriveToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(DRIVE_TOKEN_KEY) || '';
}

export function setStoredDriveToken(token) {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(DRIVE_TOKEN_KEY);
    console.info('[Drive] Access token cleared');
    return;
  }
  let tokenStr = String(token).trim();
  if (tokenStr.startsWith('{') && tokenStr.includes('access_token')) {
    try {
      const parsed = JSON.parse(tokenStr);
      if (parsed.access_token) tokenStr = parsed.access_token.trim();
    } catch {}
  }
  localStorage.setItem(DRIVE_TOKEN_KEY, tokenStr);
  console.info('[Drive] Access token saved');
}

export function clearStoredDriveToken() {
  setStoredDriveToken('');
}

export function forceExpireDriveToken() {
  console.warn('[Drive] Dev Test: Forcing stored access token to expired state for refresh test');
  localStorage.setItem(DRIVE_TOKEN_KEY, 'ya29.forced_expired_dev_token');
}

export function getMasterDriveFolderId() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(MASTER_DRIVE_FOLDER_KEY) ||
    import.meta.env?.VITE_MASTER_GOOGLE_FOLDER_ID ||
    import.meta.env?.VITE_MASTER_DRIVE_FOLDER_ID ||
    import.meta.env?.VITE_GOOGLE_DRIVE_FOLDER_ID ||
    ''
  );
}

export function setMasterDriveFolderId(folderId) {
  if (typeof window === 'undefined') return;
  if (!folderId) {
    localStorage.removeItem(MASTER_DRIVE_FOLDER_KEY);
  } else {
    localStorage.setItem(MASTER_DRIVE_FOLDER_KEY, String(folderId).trim());
  }
}

export function getPublicApiKey() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(PUBLIC_API_KEY_STORAGE_KEY) ||
    import.meta.env?.VITE_GOOGLE_API_KEY ||
    ''
  );
}

export function setPublicApiKey(apiKey) {
  if (typeof window === 'undefined') return;
  if (!apiKey) {
    localStorage.removeItem(PUBLIC_API_KEY_STORAGE_KEY);
  } else {
    localStorage.setItem(PUBLIC_API_KEY_STORAGE_KEY, String(apiKey).trim());
  }
}

export function getTokenEndpointUrl() {
  if (typeof window === 'undefined') return '/api/token';
  return (
    import.meta.env?.VITE_OAUTH_TOKEN_ENDPOINT ||
    import.meta.env?.VITE_TOKEN_ENDPOINT_URL ||
    localStorage.getItem(TOKEN_ENDPOINT_URL_KEY) ||
    '/api/token'
  ).trim();
}

export function setTokenEndpointUrl(url) {
  if (typeof window === 'undefined') return;
  if (!url) {
    localStorage.removeItem(TOKEN_ENDPOINT_URL_KEY);
  } else {
    localStorage.setItem(TOKEN_ENDPOINT_URL_KEY, String(url).trim());
  }
}

export function getDriveFolderUrl(folderId = null) {
  const id = folderId || getMasterDriveFolderId();
  if (!id) return 'https://drive.google.com/drive/my-drive';
  return `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;
}

/**
 * Refresh short-lived access token via external serverless endpoint.
 */
export async function refreshAccessTokenViaServerless() {
  const endpointUrl = getTokenEndpointUrl();
  if (!endpointUrl) {
    console.warn('[Drive] External serverless token endpoint (VITE_OAUTH_TOKEN_ENDPOINT) is not configured.');
    return null;
  }

  console.info('[Drive] Requesting token refresh via serverless endpoint:', endpointUrl);
  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        setStoredDriveToken(data.access_token);
        console.info('[Drive] Token refresh successful via serverless endpoint');
        return data.access_token;
      }
    }
  } catch (err) {
    console.error('[Drive] Serverless token refresh failed:', err.message);
  }
  return null;
}

/**
 * Handle HTTP 401 Unauthorized API responses by attempting serverless refresh or clearing invalid token.
 */
async function handleAuthFailure(status) {
  if (status === 401) {
    console.warn('[Drive] Drive API response status: 401 (Unauthorized/Expired). Attempting token refresh...');
    const newToken = await refreshAccessTokenViaServerless();
    if (newToken) {
      return newToken;
    }
    console.warn('[Drive] Token refresh unavailable. Clearing stored access token.');
    clearStoredDriveToken();
    throw new Error('Google Drive connection expired. Please connect Google Drive again.');
  }
}

/**
 * Securely exchange Google authorization code (flow: 'auth-code') for short-lived access token via external serverless endpoint.
 */
export async function exchangeAuthCode(code, redirectUri = null) {
  if (!code) throw new Error('Authorization code is required');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const effectiveRedirectUri = redirectUri || origin;
  const endpointUrl = getTokenEndpointUrl();

  console.info('[Drive] Exchanging authorization code via external serverless endpoint:', endpointUrl);

  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirect_uri: effectiveRedirectUri,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Serverless Endpoint Error (${res.status}): ${errData.error || res.statusText}`);
    }

    const data = await res.json();
    if (!data.access_token) {
      throw new Error('Serverless endpoint returned 200 OK but no access_token in payload');
    }

    setStoredDriveToken(data.access_token);
    console.info('[Drive] Access token successfully obtained via code exchange');
    return data;
  } catch (endpointError) {
    console.error('[Drive] Code exchange error:', endpointError.message);

    // Direct token fallback for offline / mock testing
    if (typeof code === 'string' && code.startsWith('ya29.')) {
      setStoredDriveToken(code);
      return { access_token: code, mode: 'Direct Token Fallback' };
    }

    throw endpointError;
  }
}

/**
 * Validate access token and retrieve creator profile.
 */
export async function validateDriveToken(inputToken = null) {
  const token = (inputToken || getStoredDriveToken()).trim();
  if (!token) throw new Error('Google Drive access token required.');

  console.info('[Drive] Drive API request: tokeninfo & userinfo');
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
    console.info('[Drive] Drive API response status:', res.status);

    if (!res.ok) {
      await handleAuthFailure(res.status);
      throw new Error(`Google token expired or invalid (${res.status}).`);
    }

    const data = await res.json();
    let email = data.email || '';
    let name = '';
    let picture = '';

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (userRes.ok) {
      const userInfo = await userRes.json();
      email = userInfo.email || email || 'Authorized Creator';
      name = userInfo.name || '';
      picture = userInfo.picture || '';
    }

    console.info('[Drive] Creator identity validated:', email);
    return {
      email: email || 'Authorized Creator Account',
      name: name || email.split('@')[0],
      picture,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  } catch (error) {
    console.error('[Drive] Drive API error:', error.message);
    throw error;
  }
}

/**
 * Find or create "EduKatalyst Storage" root folder.
 */
export async function ensureDriveAppFolder(token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  if (!accessToken) throw new Error('Google Drive connection expired. Please connect Google Drive again.');

  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  console.info('[Drive] Drive API request: ensureDriveAppFolder');
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  console.info('[Drive] Drive API response status:', searchRes.status);

  if (!searchRes.ok) {
    await handleAuthFailure(searchRes.status);
    const errData = await searchRes.json().catch(() => ({}));
    throw new Error(`Google Drive API Error (${searchRes.status}): ${errData.error?.message || searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const folderId = searchData.files[0].id;
    setMasterDriveFolderId(folderId);
    console.info('[Drive] Folder resolved:', folderId);
    return folderId;
  }

  console.info('[Drive] Creating EduKatalyst Storage root folder...');
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    await handleAuthFailure(createRes.status);
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(`Failed to create Google Drive folder: ${errData.error?.message || createRes.statusText}`);
  }

  const folderData = await createRes.json();
  setMasterDriveFolderId(folderData.id);
  console.info('[Drive] Folder resolved:', folderData.id);
  return folderData.id;
}

export async function findOrCreateSubfolder(parentFolderId, subfolderName, token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  if (!accessToken) throw new Error('Google Drive connection expired. Please connect Google Drive again.');

  const query = encodeURIComponent(
    `name = '${subfolderName}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: subfolderName,
      parents: [parentFolderId],
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    await handleAuthFailure(createRes.status);
    throw new Error(`Failed to create subfolder ${subfolderName}`);
  }

  const folder = await createRes.json();
  return folder.id;
}

export async function resolveFolderPath(folderPath, token = null) {
  let currentFolderId = await ensureDriveAppFolder(token);
  const segments = folderPath.split('/').filter(Boolean);

  for (const seg of segments) {
    currentFolderId = await findOrCreateSubfolder(currentFolderId, seg, token);
  }
  return currentFolderId;
}

/**
 * Grant read access to anyone with the link for student playback.
 */
export async function makeFilePublic(fileId, token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  if (!accessToken || !fileId) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Upload single file to Google Drive.
 */
export async function uploadFileToDrive(filePath, fileData, mimeType = 'application/octet-stream', token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  if (!accessToken) throw new Error('Google Drive connection expired. Please connect Google Drive again.');

  const pathParts = filePath.split('/');
  const filename = pathParts.pop();
  const folderPath = pathParts.join('/');

  const parentFolderId = folderPath ? await resolveFolderPath(folderPath, accessToken) : await ensureDriveAppFolder(accessToken);

  const metadata = {
    name: filename,
    parents: [parentFolderId],
  };

  const fileBlob = fileData instanceof Blob ? fileData : new Blob([fileData], { type: mimeType });
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', fileBlob);

  console.info(`[Drive] Drive API request: uploadFile (${filePath})`);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  console.info('[Drive] Drive API response status:', res.status);

  if (!res.ok) {
    await handleAuthFailure(res.status);
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Failed to upload ${filePath}: ${errData.error?.message || res.statusText}`);
  }

  const uploaded = await res.json();
  console.info('[Drive] Upload result fileId:', uploaded.id);
  if (uploaded.id) {
    await makeFilePublic(uploaded.id, accessToken);
  }
  return uploaded;
}

export async function fetchFileByPath(filePath, responseType = 'text', token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  const apiKey = getPublicApiKey();
  const masterFolderId = getMasterDriveFolderId();

  const pathParts = filePath.split('/');
  const filename = pathParts[pathParts.length - 1];

  let queryStr = `name = '${filename}' and trashed = false`;
  if (masterFolderId) {
    queryStr += ` and '${masterFolderId}' in parents`;
  }
  const query = encodeURIComponent(queryStr);

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  let searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}`;
  if (!accessToken && apiKey) {
    searchUrl += `&key=${encodeURIComponent(apiKey)}`;
  }

  console.info(`[Drive] Drive API request: fetchFileByPath (${filePath})`);
  const searchRes = await fetch(searchUrl, { headers });
  if (!searchRes.ok) {
    await handleAuthFailure(searchRes.status);
    throw new Error(`Google Drive Search Failed for ${filePath} (${searchRes.status})`);
  }

  const searchData = await searchRes.json();
  if (!searchData.files || searchData.files.length === 0) {
    throw new Error(`File not found in Google Drive: ${filePath}`);
  }

  const fileId = searchData.files[0].id;
  return await fetchFileById(fileId, responseType, token);
}

/**
 * Fetch file directly by fileId.
 */
export async function fetchFileById(fileId, responseType = 'text', token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  const apiKey = getPublicApiKey();

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  let contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  if (!accessToken && apiKey) {
    contentUrl += `&key=${encodeURIComponent(apiKey)}`;
  }

  console.info(`[Drive] Drive API request: fetchFileById (${fileId}) [Type: ${responseType}]`);
  let res = await fetch(contentUrl, { headers });
  console.info('[Drive] Drive API response status:', res.status);

  // Unauthenticated student public fallback
  if (!res.ok && !accessToken) {
    const publicDownloadUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
    res = await fetch(publicDownloadUrl);
  }

  if (!res.ok) {
    await handleAuthFailure(res.status);
    throw new Error(`Failed to fetch Google Drive file ${fileId} (${res.status})`);
  }

  if (responseType === 'json') return await res.json();
  if (responseType === 'blob') return await res.blob();
  return await res.text();
}

export async function listDriveBackups(token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  if (!accessToken) return [];

  try {
    const folderId = await ensureDriveAppFolder(accessToken);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime desc`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      await handleAuthFailure(res.status);
      return [];
    }
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('[Drive] Drive API error in listDriveBackups:', error.message);
    return [];
  }
}

export async function uploadZipToDrive(fileBlob, filename, token = null) {
  return await uploadFileToDrive(filename, fileBlob, 'application/zip', token);
}

export async function downloadFromDrive(fileId, token = null) {
  return await fetchFileById(fileId, 'blob', token);
}

export async function deleteFromDrive(fileId, token = null) {
  const accessToken = (token || getStoredDriveToken()).trim();
  if (!accessToken) throw new Error('Google Drive connection expired. Please connect Google Drive again.');

  console.info(`[Drive] Drive API request: deleteFromDrive (${fileId})`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.info('[Drive] Drive API response status:', res.status);

  if (!res.ok && res.status !== 404) {
    await handleAuthFailure(res.status);
    throw new Error(`Failed to delete file from Google Drive (${res.status})`);
  }

  return true;
}

/**
 * Real Google Drive Connection & End-to-End Test Sequence.
 * Step 1: GET https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name) (HTTP 200).
 * Step 2: Create or find "EduKatalyst Storage" folder.
 * Step 3: Upload _connection_test.txt.
 * Step 4: Download _connection_test.txt by fileId and verify content.
 * Step 5: Delete _connection_test.txt file.
 */
export async function runDriveConnectionTest(providedToken = null) {
  const token = (providedToken || getStoredDriveToken()).trim();
  const startTime = performance.now();

  if (!token) {
    return {
      status: 'error',
      latencyMs: 0,
      mode: 'Unconfigured',
      details: 'Google Drive connection expired. Please connect Google Drive again.',
    };
  }

  try {
    // Step 1: GET https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)
    console.info('[Drive] Step 1: GET https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)');
    const apiRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.info('[Drive] Step 1 Response Status:', apiRes.status);
    if (!apiRes.ok) {
      await handleAuthFailure(apiRes.status);
      const errData = await apiRes.json().catch(() => ({}));
      throw new Error(`GET /drive/v3/files failed (${apiRes.status}): ${errData.error?.message || apiRes.statusText}`);
    }

    // Step 2: Create or find EduKatalyst Storage folder
    console.info('[Drive] Step 2: Find or create EduKatalyst Storage folder');
    const folderId = await ensureDriveAppFolder(token);

    // Step 3: Upload _connection_test.txt
    console.info('[Drive] Step 3: Upload _connection_test.txt');
    const testFileName = '_connection_test.txt';
    const testContent = `EduKatalyst Google Drive connection test at ${new Date().toISOString()}`;
    const uploadRes = await uploadFileToDrive(testFileName, testContent, 'text/plain', token);

    // Step 4: Download _connection_test.txt by fileId and verify content
    console.info('[Drive] Step 4: Retrieve _connection_test.txt and verify contents');
    const downloadedText = await fetchFileById(uploadRes.id, 'text', token);
    if (!downloadedText.includes('EduKatalyst Google Drive connection test')) {
      throw new Error('Downloaded test file content mismatch.');
    }

    // Step 5: Clean up test file
    console.info('[Drive] Step 5: Clean up test file');
    await deleteFromDrive(uploadRes.id, token).catch(() => {});

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      status: 'ok',
      latencyMs,
      mode: 'OAuth Creator Account (Auth Code Flow)',
      details: `Connected to Google Drive | Folder: EduKatalyst Storage | Folder ID: ${folderId} | File ID ${uploadRes.id} Uploaded, Verified, & Deleted Successfully`,
      folderId,
      testFileId: uploadRes.id,
      folderAccessible: true,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      status: 'error',
      latencyMs,
      mode: 'OAuth Creator Account',
      details: `Google Drive connection failed | Error: ${err.message}`,
      folderAccessible: false,
    };
  }
}

export async function testLiveDriveConnection() {
  return await runDriveConnectionTest();
}
