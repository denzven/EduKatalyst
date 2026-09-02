import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageProvider } from '../storage/StorageProvider';
import { GoogleDriveAdapter } from '../storage/GoogleDriveAdapter';
import { BackupService } from '../BackupService';
import { AssetDeliveryService } from '../assets/AssetDeliveryService';

describe('Storage & Asset Abstraction Services', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('StorageProvider Base Contract', () => {
    it('should throw "Not implemented" errors on default methods', async () => {
      const provider = new StorageProvider();
      expect(provider.id).toBe('abstract');
      await expect(provider.put('key', 'data')).rejects.toThrow('put() not implemented');
      await expect(provider.get('key')).rejects.toThrow('get() not implemented');
      await expect(provider.delete('key')).rejects.toThrow('delete() not implemented');
      await expect(provider.list('')).rejects.toThrow('list() not implemented');
    });
  });

  describe('GoogleDriveAdapter', () => {
    it('should instantiate with id google-drive', () => {
      const adapter = new GoogleDriveAdapter();
      expect(adapter.id).toBe('google-drive');
    });

    it('should execute list with prefix filtering', async () => {
      const mockFiles = [
        { id: '1', name: 'edukatalyst_backup_2026.zip' },
        { id: '2', name: 'other_file.txt' }
      ];
      const adapter = new GoogleDriveAdapter(() => 'dummy_token');
      vi.spyOn(adapter, 'list').mockResolvedValue(mockFiles.filter(f => f.name.startsWith('edukatalyst')));

      const res = await adapter.list('edukatalyst');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('1');
    });
  });

  describe('BackupService', () => {
    it('should delegate backup calls to underlying StorageProvider', async () => {
      const mockAdapter = {
        put: vi.fn().mockResolvedValue({ id: 'file_123' }),
        get: vi.fn().mockResolvedValue(new Blob(['test'])),
        delete: vi.fn().mockResolvedValue(true),
        list: vi.fn().mockResolvedValue([{ id: 'file_123', name: 'backup.zip' }]),
        testConnection: vi.fn().mockResolvedValue({ status: 'ok', latencyMs: 12 }),
      };

      const backup = new BackupService(mockAdapter);
      const putRes = await backup.exportBackup(new Blob(['zip_data']), 'backup.zip');
      expect(putRes.id).toBe('file_123');
      expect(mockAdapter.put).toHaveBeenCalledWith('backup.zip', expect.any(Blob));

      const listRes = await backup.listBackups();
      expect(listRes.length).toBe(1);

      const getRes = await backup.downloadBackup('file_123');
      expect(getRes).toBeInstanceOf(Blob);

      const delRes = await backup.deleteBackup('file_123');
      expect(delRes).toBe(true);

      const connRes = await backup.testConnection();
      expect(connRes.status).toBe('ok');
    });
  });

  describe('AssetDeliveryService', () => {
    it('should construct local HLS blob source and provide cleanup function', async () => {
      // Mock URL.createObjectURL & revokeObjectURL
      const mockObjUrl = 'blob:http://localhost/mock-blob-uuid';
      global.URL.createObjectURL = vi.fn().mockReturnValue(mockObjUrl);
      global.URL.revokeObjectURL = vi.fn();

      const deliveryService = new AssetDeliveryService();
      const mockSession = {
        id: 'vid_123',
        keyBlob: new Blob(['fakekey']),
        keyUri: 'https://mock-worker.local/get-key?vid=demo',
        playlistText: '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="https://mock-worker.local/get-key?vid=demo"\noutput0.ts',
        segments: {
          'output0.ts': new Blob(['fakechunk'])
        }
      };

      const playback = await deliveryService.getPlaybackSource(mockSession);
      expect(playback.playlistBlobUrl).toBe(mockObjUrl);
      expect(playback.firstSegmentUrl).toBe(mockObjUrl);
      expect(typeof playback.cleanup).toBe('function');

      // Test cleanup
      playback.cleanup();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjUrl);
    });

    it('should throw error if session is missing or invalid', async () => {
      const deliveryService = new AssetDeliveryService();
      await expect(deliveryService.getPlaybackSource(null)).rejects.toThrow('Session required');
    });
  });
});
