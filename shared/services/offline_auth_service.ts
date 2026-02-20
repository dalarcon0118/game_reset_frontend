import { TokenService } from './token_service';
import { hashString } from '../utils/crypto';
import { logger } from '../utils/logger';

const log = logger.withTag('OFFLINE_AUTH');

/**
 * OfflineAuthService
 * Encapsulates logic for offline authentication and credential persistence.
 */
export const OfflineAuthService = {
    /**
     * Validates credentials against locally stored data.
     */
    async validateCredentials(username: string, pin: string): Promise<any | null> {
        try {
            const lastUser = await TokenService.getLastUsername();
            const savedHash = await TokenService.getUserPinHash();
            const savedProfile = await TokenService.getUserProfile();
            const hashedPin = await hashString(pin);

            if (username === lastUser && hashedPin === savedHash && savedProfile) {
                log.info('Offline validation successful');
                return { ...savedProfile, isOffline: true };
            }
            
            log.warn('Offline validation failed', { 
                matchUser: username === lastUser, 
                hasHash: !!savedHash,
                hasProfile: !!savedProfile 
            });
            return null;
        } catch (error) {
            log.error('Error during offline validation', error);
            return null;
        }
    },

    /**
     * Saves credentials and profile for future offline access.
     */
    async saveOfflineCredentials(username: string, pin: string, userProfile: any): Promise<void> {
        try {
            const hashedPin = await hashString(pin);
            await TokenService.saveUserPinHash(hashedPin);
            await TokenService.saveLastUsername(username);
            // TokenService.saveUserProfile might already be called elsewhere, but ensuring it here is safe
            await TokenService.saveUserProfile(userProfile);
            log.info('Offline credentials saved');
        } catch (error) {
            log.error('Failed to save offline credentials', error);
        }
    }
};
