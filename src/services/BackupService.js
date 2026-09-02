import { googleDriveAdapter } from './storage/GoogleDriveAdapter';
import { getStoredDriveToken } from './googleDriveService';
import { getAllVideoSessions } from '../utils/storage';
import { importSessionFromZip } from '../utils/zipHelper';

/**
 * BackupService
 * High-level orchestration for user backups, cloud exports, and automated restore workflows.
 * Gated to backup/sync concerns; explicitly separated from Student Media Delivery.
 */
export class BackupService {
  constructor(adapter = googleDriveAdapter) {
    this.adapter = adapter;
  }

  /**
   * Check if user is authenticated with Google Drive for backups
   */
  hasDriveToken() {
    return Boolean(getStoredDriveToken());
  }

  /**
   * Upload a packaged session ZIP backup archive to cloud storage
   * @param {Blob} zipBlob
   * @param {string} filename
   */
  async exportBackup(zipBlob, filename) {
    console.info('[BackupService] Exporting backup package to cloud storage:', filename);
    return await this.adapter.put(filename, zipBlob);
  }

  /**
   * List all available backup packages in cloud storage
   */
  async listBackups() {
    return await this.adapter.list();
  }

  /**
   * Download a backup package Blob by File ID
   * @param {string} fileId
   */
  async downloadBackup(fileId) {
    console.info('[BackupService] Downloading backup package:', fileId);
    return await this.adapter.get(fileId);
  }

  /**
   * Delete a backup package by File ID
   * @param {string} fileId
   */
  async deleteBackup(fileId) {
    console.info('[BackupService] Deleting backup package:', fileId);
    return await this.adapter.delete(fileId);
  }

  /**
   * Auto-restore the latest cloud backup package if local IndexedDB is empty
   * @returns {Promise<Array>} Restored sessions or empty array
   */
  async autoRestoreLatestBackup() {
    try {
      let sessions = await getAllVideoSessions();
      if ((!sessions || sessions.length === 0) && this.hasDriveToken()) {
        const files = await this.listBackups();
        if (files && files.length > 0) {
          const latestMasterFile = files[0];
          console.info('[BackupService] Auto-restoring latest master backup:', latestMasterFile.name);
          const zipBlob = await this.downloadBackup(latestMasterFile.id);
          await importSessionFromZip(zipBlob);
          sessions = await getAllVideoSessions();
        }
      }
      return sessions || [];
    } catch (err) {
      console.warn('[BackupService] Auto-restore notice:', err);
      return [];
    }
  }

  /**
   * Test connection to backup storage provider
   */
  async testConnection() {
    return await this.adapter.testConnection();
  }
}

export const backupService = new BackupService();
export default backupService;
