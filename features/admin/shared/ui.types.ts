// Shared UI state types for admin dashboard
export interface UiState {
    error: string | null;
    loading: boolean;
    notifications: Notification[];
}

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
}
