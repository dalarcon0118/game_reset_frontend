import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { logger } from '../../utils/logger';

export interface BootstrapProviderProps {
    children: ReactNode;
    onInit: () => Promise<void>;
    onCleanup?: () => void;
    fallback?: ReactNode;
    ErrorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
    LoadingComponent?: React.ComponentType;
}

/**
 * AsyncBootstrapProvider
 * 
 * Standardized component for handling asynchronous initialization logic.
 * It manages the lifecycle (init, success, error, cleanup) and UI states.
 * 
 * Implements the "Template Method" pattern for React components.
 */
export const AsyncBootstrapProvider: React.FC<BootstrapProviderProps> = ({
    children,
    onInit,
    onCleanup,
    fallback,
    ErrorComponent,
    LoadingComponent
}) => {
    const [isReady, setReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const initialize = useCallback(async () => {
        try {
            setError(null);
            await onInit();
            setReady(true);
        } catch (err: any) {
            logger.error('Bootstrap initialization failed', 'AsyncBootstrapProvider', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        }
    }, [onInit]);

    useEffect(() => {
        initialize();
        return () => {
            if (onCleanup) onCleanup();
        };
    }, [initialize, onCleanup]);

    if (error) {
        if (ErrorComponent) {
            return <ErrorComponent error={error} retry={initialize} />;
        }
        
        // Default Error UI
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="small" color="red" />
            </View>
        );
    }

    if (!isReady) {
        if (fallback) return fallback;
        if (LoadingComponent) return <LoadingComponent />;

        // Default Loading UI
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <>{children}</>;
};
