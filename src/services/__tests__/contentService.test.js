import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCachedContent, setCachedContent, clearContentCache } from '../localCache';
import { getManifest, getNoteContent, getAssetBlob, publishContentFile } from '../contentService';
import * as googleDriveService from '../googleDriveService';

describe('Google Drive Content Storage & Cache Services', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearContentCache();
    vi.restoreAllMocks();
  });

  describe('LocalCache (IndexedDB Content Cache)', () => {
    it('should store and retrieve content records from IndexedDB', async () => {
      const testKey = 'test_note.md';
      const testData = '# Hello World Note';

      await setCachedContent(testKey, testData, 'text/markdown');
      const cached = await getCachedContent(testKey);

      expect(cached).not.toBeNull();
      expect(cached.key).toBe(testKey);
      expect(cached.data).toBe(testData);
      expect(cached.mimeType).toBe('text/markdown');
    });

    it('should return null on cache miss', async () => {
      const result = await getCachedContent('non_existent_key.json');
      expect(result).toBeNull();
    });
  });

  describe('ContentService (Cache-First Google Drive Content Access)', () => {
    it('should fetch manifest from cache if available', async () => {
      const mockManifest = { version: '2026.09.01', courses: [{ id: 'course_1', title: 'Test Course' }] };
      await setCachedContent('manifest.json', mockManifest, 'application/json');

      const manifest = await getManifest();
      expect(manifest.version).toBe('2026.09.01');
      expect(manifest.courses.length).toBe(1);
    });

    it('should fetch manifest from Google Drive on cache miss and cache result', async () => {
      const mockManifest = { version: '2026.09.02', courses: [{ id: 'course_drive', title: 'Drive Course' }] };
      vi.spyOn(googleDriveService, 'fetchFileByPath').mockResolvedValue(mockManifest);

      const manifest = await getManifest();
      expect(manifest.version).toBe('2026.09.02');

      const cached = await getCachedContent('manifest.json');
      expect(cached).not.toBeNull();
      expect(cached.data.version).toBe('2026.09.02');
    });

    it('should fetch asset directly by Google Drive fileId (1 API request) on cache miss', async () => {
      const mockBlob = new Blob(['mock video chunk'], { type: 'video/mp2t' });
      const fetchByIdSpy = vi.spyOn(googleDriveService, 'fetchFileById').mockResolvedValue(mockBlob);
      const fetchByPathSpy = vi.spyOn(googleDriveService, 'fetchFileByPath');

      const assetPath = 'courses/physics/lessons/qm_01/output000.ts';
      const fileId = 'DRIVE_FILE_ID_999';

      const blob = await getAssetBlob(assetPath, 'video/mp2t', fileId);
      expect(blob).toBeInstanceOf(Blob);
      expect(fetchByIdSpy).toHaveBeenCalledTimes(1);
      expect(fetchByIdSpy).toHaveBeenCalledWith('DRIVE_FILE_ID_999', 'blob');
      expect(fetchByPathSpy).not.toHaveBeenCalled();

      // Verify cached for repeat access
      fetchByIdSpy.mockClear();
      const repeatBlob = await getAssetBlob(assetPath, 'video/mp2t', fileId);
      expect(repeatBlob).toBeInstanceOf(Blob);
      expect(fetchByIdSpy).not.toHaveBeenCalled();
    });

    it('should publish individual content file to Google Drive and return fileId metadata', async () => {
      vi.spyOn(googleDriveService, 'uploadFileToDrive').mockResolvedValue({ id: 'file_id_123', name: 'master.m3u8' });

      const filePath = 'courses/physics/lessons/qm_01/master.m3u8';
      const playlistText = '#EXTM3U\noutput0.ts';

      const result = await publishContentFile(filePath, playlistText, 'application/x-mpegurl');
      expect(result.fileId).toBe('file_id_123');

      const cached = await getCachedContent(filePath);
      expect(cached).not.toBeNull();
    });
  });
});
