/**
 * StorageProvider.js
 * Minimal Storage Provider Interface Contract for generic persistence.
 */
export class StorageProvider {
  /** Provider identifier e.g. 'google-drive', 'indexeddb' */
  id = 'abstract';

  /**
   * Store data/blob under a given key
   * @param {string} key
   * @param {Blob|File|string|Object} data
   * @param {Object} [metadata]
   * @returns {Promise<Object>}
   */
  async put(key, data, metadata = {}) {
    throw new Error(`[StorageProvider:${this.id}] put() not implemented.`);
  }

  /**
   * Retrieve data/blob by key
   * @param {string} key
   * @returns {Promise<Blob|Object|string>}
   */
  async get(key) {
    throw new Error(`[StorageProvider:${this.id}] get() not implemented.`);
  }

  /**
   * Delete data by key
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    throw new Error(`[StorageProvider:${this.id}] delete() not implemented.`);
  }

  /**
   * List items with optional key prefix
   * @param {string} [prefix='']
   * @returns {Promise<Array<{id: string, name: string, size?: number, createdAt?: string}>>}
   */
  async list(prefix = '') {
    throw new Error(`[StorageProvider:${this.id}] list() not implemented.`);
  }
}

export default StorageProvider;
