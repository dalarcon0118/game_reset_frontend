import * as Sharing from 'expo-sharing';

export const SharingApi = {
    async shareImage(uri: string, options?: { dialogTitle?: string }): Promise<boolean> {
        const isAvailable = await Sharing.isAvailableAsync();

        if (!isAvailable) {
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
};
