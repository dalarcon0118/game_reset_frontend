export interface IUserPreferencesService {
    isTelemetryEnabled(): Promise<boolean>;
    setTelemetryEnabled(enabled: boolean): Promise<void>;
}