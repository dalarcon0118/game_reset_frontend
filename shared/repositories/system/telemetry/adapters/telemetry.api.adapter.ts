import apiClient from '@/shared/services/api_client';
import { ITelemetryApiAdapter } from '../telemetry.ports';
import { TelemetryEvent } from '../telemetry.types';

export class TelemetryApiAdapter implements ITelemetryApiAdapter {
    async sendBatch(events: TelemetryEvent[]): Promise<{ success: boolean; syncedIds: string[] }> {
        if (events.length === 0) {
            return { success: true, syncedIds: [] };
        }

        await apiClient.post('/v1/system/telemetry/batch/', {
            events
        });

        return { success: true, syncedIds: events.map((event) => event.id) };
    }
}
