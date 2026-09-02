import { StorageProvider } from './StorageProvider';
import {
  uploadZipToDrive,
  downloadFromDrive,
  deleteFromDrive,
  listDriveBackups,
  getStoredDriveToken,
  testLiveDriveConnection
} from '../googleDriveService';

/**
 * GoogleDriveAdapter
 * Encapsulates Google Drive API operations behind the standard StorageProvider interface contract.
 */
export class GoogleDriveAdapter extends StorageProvider {
  id = 'google-drive';

  constructor(tokenProvider = null) {
    super();
    this.getToken = typeof tokenProvider === 'function' ? tokenProvider : () => getStoredDriveToken();
  }

  /**
   * Upload file Blob to Google Drive
   * @param {string} filename
   * @param {Blob} fileBlob
   * @param {Object} [metadata]
   */
  async put(filename, fileBlob, metadata = {}) {
    const token = this.getToken();
    return await uploadZipToDrive(fileBlob, filename, token);
  }

  /**
   * Download file Blob from Google Drive by File ID
   * @param {string} fileId
   */
  async get(fileId) {
    const token = this.getToken();
    return await downloadFromDrive(fileId, token);
  }

  /**
   * Delete file from Google Drive by File ID
   * @param {string} fileId
   */
  async delete(fileId) {
    const token = this.getToken();
    return await deleteFromDrive(fileId, token);
  }

  /**
   * List backup files in Google Drive folder
   * @param {string} [prefix='']
   */
  async list(prefix = '') {
    const token = this.getToken();
    const files = await listDriveBackups(token);
    if (!prefix) return files;
    return files.filter((f) => f.name && f.name.startsWith(prefix));
  }

  /**
   * Test live network connection to Google Drive API
   */
  async testConnection() {
    return await testLiveDriveConnection();
  }
}

export const googleDriveAdapter = new GoogleDriveAdapter();
export default googleDriveAdapter;
