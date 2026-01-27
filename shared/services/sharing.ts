import * as Sharing from 'expo-sharing';

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
        
        const isAvailable = await Sharing.isAvailableAsync();

        if (!isAvailable) {
            console.error('[SharingService] Sharing not available on this platform');
            throw new Error('La funcionalidad de compartir no está disponible en este dispositivo');
        }

        // Ensure URI has the correct format for Android (file:// prefix)
        const shareUri = uri.startsWith('file://') ? uri : `file://${uri}`;

        await Sharing.shareAsync(shareUri, {
            mimeType: 'image/png',
            dialogTitle: options?.dialogTitle || 'Compartir Imagen',
            UTI: 'public.png'
        });

        return true;
    }
}
