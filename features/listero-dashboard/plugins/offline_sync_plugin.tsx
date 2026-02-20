/**
 * OfflineSyncPlugin - Plugin para sincronización offline
 * 
 * Integra el sistema de sincronización offline con el sistema de plugins.
 * El sync ocurre automáticamente en background cada 5 minutos.
 * 
 * Feature Flag: OFFLINE_SYNC_ENABLED
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Icon } from '@ui-kitten/components';
import { Plugin, SlotProps } from '@/shared/core/plugins/plugin.types';
import { useOfflineSyncStore } from './offline_sync_plugin/store';
import type { ToastConfig } from './offline_sync_plugin/types';
import { OfflineFinancialService } from '@/shared/services/offline';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('OFFLINE_SYNC_PLUGIN');

// ============================================================================
// Daily Cleanup Scheduler
// ============================================================================

let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Programa la limpieza diaria de apuestas sincronizadas a las 00:00
 */
function scheduleDailyCleanup(): void {
  // Limpiar timeout anterior si existe
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  log.debug(`Scheduling daily cleanup in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);

  cleanupTimeout = setTimeout(async () => {
    log.info('Running daily maintenance...');
    await OfflineFinancialService.runMaintenance();
    // Re-programar para el siguiente día
    scheduleDailyCleanup();
  }, msUntilMidnight);
}

/**
 * Detiene el scheduler de limpieza diaria
 */
function stopDailyCleanup(): void {
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
    log.debug('Daily cleanup scheduler stopped');
  }
}

// ============================================================================
// Feature Flag
// ============================================================================

export const OFFLINE_SYNC_ENABLED = true;

// ============================================================================
// Toast Component Simplificado
// ============================================================================

interface ToastItemProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return { bg: '#E8F5E9', border: '#4CAF50', icon: '#4CAF50', iconName: 'checkmark-circle' };
      case 'error':
        return { bg: '#FFEBEE', border: '#F44336', icon: '#F44336', iconName: 'alert-circle' };
      case 'warning':
        return { bg: '#FFF3E0', border: '#FF9800', icon: '#FF9800', iconName: 'alert-triangle' };
      case 'syncing':
        return { bg: '#E8EAF6', border: '#3F51B5', icon: '#3F51B5', iconName: 'sync' };
      default:
        return { bg: '#E3F2FD', border: '#2196F3', icon: '#2196F3', iconName: 'info' };
    }
  };

  const styles = getStyles();

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: styles.bg,
          borderLeftColor: styles.border,
        },
      ]}
    >
      <Icon name={styles.iconName} width={24} height={24} fill={styles.icon} />
      <View style={toastStyles.content}>
        <Text style={toastStyles.title}>{toast.title}</Text>
        {toast.message && <Text style={toastStyles.message}>{toast.message}</Text>}
      </View>
      <TouchableOpacity onPress={handleDismiss} style={toastStyles.closeButton}>
        <Icon name="close" width={20} height={20} fill="#666" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// Toast Container Component (para Slot)
// ============================================================================

const ToastContainer: React.FC<SlotProps> = () => {
  const { model, hideToast } = useOfflineSyncStore();
  const { toasts } = model;

  if (toasts.length === 0) return null;

  return (
    <View style={toastStyles.overlay}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={hideToast} />
      ))}
    </View>
  );
};

// ============================================================================
// Plugin Definition
// ============================================================================

const OfflineSyncPlugin: Plugin = {
  id: 'listero.dashboard.offline-sync',
  name: 'Offline Sync',
  metadata: {
    version: '1.0.0',
  },

  slots: {
    'app.toast': {
      component: ToastContainer,
      layout: {
        order: 0,
        fullWidth: true,
      },
    },
  },

  /**
   * Inicialización del plugin
   * Arranca el sync worker con intervalo de 5 minutos
   */
  init: async (context) => {
    if ((OfflineSyncPlugin as any)._initialized) {
      log.debug('Plugin already initialized, skipping...');
      return;
    }

    log.info('Initializing...');

    try {
      (OfflineSyncPlugin as any)._initialized = true;
      // Inicializar store y sync worker
      const store = useOfflineSyncStore.getState();
      await store.initialize();

      // Programar limpieza diaria a las 00:00
      scheduleDailyCleanup();

      log.info('Initialized successfully');

      // Suscribirse a cambios de estado de red
      const unsubscribe = context.events.subscribe('network:status', (data) => {
        if (data.isOnline) {
          log.debug('Network restored, triggering sync...');
          store.forceSync();
        }
      });

      // Guardar función de cleanup en el contexto del plugin
      (OfflineSyncPlugin as any)._cleanup = unsubscribe;

    } catch (error) {
      log.error('Initialization error', error);
    }
  },

  /**
   * Cleanup al desactivar el plugin
   */
  destroy: () => {
    log.info('Destroying...');

    // Detener sync worker
    const store = useOfflineSyncStore.getState();
    store.cleanup();

    // Detener limpieza diaria
    stopDailyCleanup();

    // Limpiar suscripciones
    const cleanup = (OfflineSyncPlugin as any)._cleanup;
    if (cleanup) {
      cleanup();
    }

    (OfflineSyncPlugin as any)._initialized = false;
    log.info('Destroyed');
  },
};

// ============================================================================
// Styles
// ============================================================================

const toastStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  message: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

// ============================================================================
// Exports
// ============================================================================

export { ToastContainer };
export default OfflineSyncPlugin;
