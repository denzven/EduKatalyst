/**
 * AssetDeliveryService.js
 * Encapsulates media playback source resolution for student video player.
 * Current implementation constructs local in-memory HLS Blob URLs from IndexedDB sessions.
 * Provides a clean seam for future CDN URL resolution without modifying React UI components.
 */
import { getHlsPlaybackSource } from '../contentService';

export class AssetDeliveryService {
  /**
   * Constructs an HLS playback source from a video session record or lesson path
   * @param {Object} session - Video session object
   */
  async getPlaybackSource(session) {
    return await getHlsPlaybackSource(session);
  }
}

export const assetDeliveryService = new AssetDeliveryService();
export default assetDeliveryService;
