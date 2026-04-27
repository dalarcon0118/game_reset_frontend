import storageClient from '@core/offline-storage/storage_client';
import { IUserPreferencesService } from './ports';

const TELEMETRY_KEY = '@v2:user:preferences:telemetry_enabled';

class UserPreferencesRepository implements IUserPreferencesService {
    async isTelemetryEnabled(): Promise<boolean> {
        const value = await storageClient.get<boolean>(TELEMETRY_KEY);
        return value ?? true;
    }

    async setTelemetryEnabled(enabled: boolean): Promise<void> {
        await storageClient.set(TELEMETRY_KEY, enabled);
    }
}

export const userPreferences = new UserPreferencesRepository();