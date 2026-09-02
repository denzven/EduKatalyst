/**
 * ContentService.js
 * Central application content service.
 * ASD-STE100: Simple, direct technical implementation.
 * Uses a Cache-First strategy with Google Drive File ID direct resolution:
 * 1. Reads LocalCache (IndexedDB).
 * 2. On cache miss, fetches from Google Drive via fileId (or path fallback).
 * 3. Saves remote file to LocalCache for offline access.
 */

import { getCachedContent, setCachedContent } from './localCache';
import * as googleDriveService from './googleDriveService';

/**
 * Fetch course catalog manifest.
 * Cache-first -> Google Drive -> Fallback to static public/manifest.json.
 */
export async function getManifest() {
  const cacheKey = 'manifest.json';
  const cached = await getCachedContent(cacheKey);
  if (cached && cached.data) {
    return cached.data;
  }

  try {
    const data = await googleDriveService.fetchFileByPath('manifest.json', 'json');
    await setCachedContent(cacheKey, data, 'application/json');
    return data;
  } catch (err) {
    console.warn('[ContentService] Remote manifest fetch notice:', err.message);
    try {
      const res = await fetch('./manifest.json');
      if (res.ok) {
        const publicManifest = await res.json();
        await setCachedContent(cacheKey, publicManifest, 'application/json');
        return publicManifest;
      }
    } catch {}
  }

  return { version: '1.0.0', courses: [], sessions: [] };
}

/**
 * Fetch Markdown note content.
 * Cache-first -> Google Drive fetch by fileId or path.
 */
export async function getNoteContent(notePath, fileId = null) {
  const cacheKey = notePath.startsWith('notes/') ? notePath : `notes/${notePath}`;
  const cached = await getCachedContent(cacheKey);
  if (cached && typeof cached.data === 'string') {
    return cached.data;
  }

  let text;
  if (fileId) {
    text = await googleDriveService.fetchFileById(fileId, 'text');
  } else {
    text = await googleDriveService.fetchFileByPath(cacheKey, 'text');
  }

  await setCachedContent(cacheKey, text, 'text/markdown');
  return text;
}

/**
 * Fetch media asset Blob (image, PDF, thumbnail, HLS segment).
 * Cache-first -> Google Drive fetch by direct fileId (or path fallback).
 * ASD-STE100: Single network request when fileId is present.
 */
export async function getAssetBlob(assetPath, mimeType = 'application/octet-stream', fileId = null) {
  const cached = await getCachedContent(assetPath);
  if (cached && cached.data instanceof Blob) {
    return cached.data;
  }

  let blob;
  if (fileId) {
    blob = await googleDriveService.fetchFileById(fileId, 'blob');
  } else {
    blob = await googleDriveService.fetchFileByPath(assetPath, 'blob');
  }

  await setCachedContent(assetPath, blob, mimeType);
  return blob;
}

/**
 * Publish individual course asset file to Google Drive and update local cache.
 * Returns fileId and metadata for manifest indexing.
 */
export async function publishContentFile(filePath, fileData, mimeType = 'application/octet-stream') {
  const fileBlob = fileData instanceof Blob ? fileData : new Blob([fileData], { type: mimeType });
  const result = await googleDriveService.uploadFileToDrive(filePath, fileBlob, mimeType);
  
  const record = {
    path: filePath,
    fileId: result.id,
    mimeType,
  };

  await setCachedContent(filePath, fileBlob, mimeType);
  return record;
}

/**
 * Construct HLS playback source for VideoPlayer.
 * If local IndexedDB session has segment Blobs, uses local Blob URLs.
 * If remote, fetches master.m3u8 and prepares playlist for on-demand segment loading.
 */
export async function getHlsPlaybackSource(session) {
  if (!session) throw new Error('[ContentService] Session required for HLS playback.');

  const createdUrls = [];

  // Local IndexedDB session (from local WASM authoring or restored cache)
  if (session.segments && Object.keys(session.segments).length > 0) {
    let keyBlobUrl = '';
    if (session.keyBlob) {
      keyBlobUrl = URL.createObjectURL(session.keyBlob);
      createdUrls.push(keyBlobUrl);
    }

    const segmentBlobUrls = {};
    const segmentNames = Object.keys(session.segments);

    segmentNames.forEach((segName) => {
      const segBlob = session.segments[segName];
      if (segBlob) {
        const segUrl = URL.createObjectURL(segBlob);
        segmentBlobUrls[segName] = segUrl;
        createdUrls.push(segUrl);
      }
    });

    const firstSegmentUrl = segmentNames.length > 0 ? segmentBlobUrls[segmentNames[0]] : null;

    let playlistText = session.playlistText || '';
    if (session.keyUri) {
      const keyPattern = new RegExp(
        `URI=["']?${session.keyUri.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?`,
        'g'
      );
      playlistText = playlistText.replace(keyPattern, `URI="${keyBlobUrl}"`);
    }
    playlistText = playlistText.replace(/URI="enc\.key"/g, `URI="${keyBlobUrl}"`);

    segmentNames.forEach((segName) => {
      playlistText = playlistText.replace(new RegExp(segName, 'g'), segmentBlobUrls[segName]);
    });

    const playlistBlob = new Blob([playlistText], { type: 'application/x-mpegurl' });
    const playlistBlobUrl = URL.createObjectURL(playlistBlob);
    createdUrls.push(playlistBlobUrl);

    return {
      playlistBlobUrl,
      firstSegmentUrl,
      isRemoteOnDemand: false,
      cleanup: () => createdUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} }),
    };
  }

  // Remote Google Drive HLS playback (On-demand individual segment fetching)
  const basePath = session.remotePath || `courses/${session.category || 'general'}/lessons/${session.id}/video`;
  const playlistPath = `${basePath}/master.m3u8`;
  const masterFileId = session.playlistFileId || session.fileId || session.assetFileIds?.['master.m3u8'];

  // Fetch master.m3u8 using stored fileId (1 request on cache miss)
  const playlistBlob = await getAssetBlob(playlistPath, 'application/x-mpegurl', masterFileId);
  const playlistText = await playlistBlob.text();

  const lines = playlistText.split('\n');
  const assetFileIds = session.assetFileIds || {};

  // Rewrite playlist segment lines with fileId query parameters for on-demand loading
  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;

    const segFileId = assetFileIds[trimmed] || assetFileIds[`${basePath}/${trimmed}`];
    const segPath = trimmed.includes('/') ? trimmed : `${basePath}/${trimmed}`;
    if (segFileId) {
      return `${segPath}?fileId=${encodeURIComponent(segFileId)}`;
    }
    return segPath;
  });

  const finalPlaylistText = rewrittenLines.join('\n');
  const finalBlob = new Blob([finalPlaylistText], { type: 'application/x-mpegurl' });
  const playlistBlobUrl = URL.createObjectURL(finalBlob);
  createdUrls.push(playlistBlobUrl);

  return {
    playlistBlobUrl,
    firstSegmentUrl: null,
    isRemoteOnDemand: true,
    assetFileIds,
    basePath,
    cleanup: () => createdUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} }),
  };
}

export default {
  getManifest,
  getNoteContent,
  getAssetBlob,
  publishContentFile,
  getHlsPlaybackSource,
};
