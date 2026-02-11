import { SharingApi } from './sharing/api';

/**
 * Service to handle file sharing operations using expo-sharing.
 */
export class SharingService {
    /**
     * Shares an image file given its local URI.
     * 
     * @param uri The local URI of the image to share.
     * @param options Optional configuration for the sharing dialog.
     * @returns A promise that resolves to true if the sharing dialog was opened.
     */
    static async shareImage(uri: string, options?: { dialogTitle?: string }): Promise<boolean> {
        console.log('[SharingService] Attempting to share URI:', uri);
        try {
            return await SharingApi.shareImage(uri, options);
        } catch (error) {
            console.error('[SharingService] Error sharing image:', error);
            throw error;
        }
    }
}
