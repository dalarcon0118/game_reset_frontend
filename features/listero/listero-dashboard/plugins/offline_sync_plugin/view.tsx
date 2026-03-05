/**
 * OfflineSyncPlugin - View
 * 
 * Componentes UI para Toast Notifications y Sync Status Screen.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Icon, Button } from '@ui-kitten/components';
import { Badge } from '@/shared/components/badge';
import { Card } from '@/shared/components/card';
import type { OfflineSyncModel, ToastConfig, ToastType } from './types';
import { 
  OfflineSyncMsg,
  CLOSE_STATUS_MODAL,
  FORCE_SYNC,
  CLEAR_ERRORS,
  SET_ACTIVE_TAB,
  HIDE_TOAST,
  OPEN_STATUS_MODAL
} from './msg';
import { getToastIconName } from './types';

// ============================================================================
// Toast Component
// ============================================================================

interface ToastViewProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
}

const ToastView: React.FC<ToastViewProps> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleDismiss = React.useCallback(() => {
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
  }, [onDismiss, toast.id, translateY, opacity]);

  useEffect(() => {
    // Entrance animation
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

    // Spinning for syncing type
    let spinAnimation: Animated.CompositeAnimation | null = null;
    if (toast.type === 'syncing') {
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    }

    // Auto-dismiss
    let timer: NodeJS.Timeout | null = null;
    if (toast.duration && toast.duration > 0) {
      timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
    }

    return () => {
      if (spinAnimation) spinAnimation.stop();
      if (timer) clearTimeout(timer);
    };
  }, [toast.id, toast.type, toast.duration, handleDismiss, translateY, opacity, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getTypeStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: '#E8F5E9', border: '#4CAF50', icon: '#4CAF50' };
      case 'error':
        return { bg: '#FFEBEE', border: '#F44336', icon: '#F44336' };
      case 'warning':
        return { bg: '#FFF3E0', border: '#FF9800', icon: '#FF9800' };
      case 'info':
        return { bg: '#E3F2FD', border: '#2196F3', icon: '#2196F3' };
      case 'syncing':
        return { bg: '#E8EAF6', border: '#3F51B5', icon: '#3F51B5' };
      default:
        return { bg: '#FAFAFA', border: '#9E9E9E', icon: '#9E9E9E' };
    }
  };

  const typeStyles = getTypeStyles(toast.type);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          borderLeftColor: typeStyles.border,
          backgroundColor: typeStyles.bg,
        },
      ]}
    >
      <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
        <Icon
          name={getToastIconName(toast.type)}
          width={24}
          height={24}
          fill={typeStyles.icon}
        />
      </Animated.View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.message && <Text style={styles.message}>{toast.message}</Text>}
        {toast.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toast.action.onPress}
          >
            <Text style={styles.actionLabel}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
        <Icon name="close" width={20} height={20} fill="#666" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// Toast Container (renders all active toasts)
// ============================================================================

interface ToastContainerProps {
  toasts: ToastConfig[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.toastOverlay}>
      {toasts.map((toast) => (
        <ToastView key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
};

// ============================================================================
// Sync Status Screen Component
// ============================================================================

interface SyncStatusScreenProps {
  model: OfflineSyncModel;
  dispatch: (msg: OfflineSyncMsg) => void;
}

const SyncStatusScreen: React.FC<SyncStatusScreenProps> = ({ model, dispatch }) => {
  const { syncStatus } = model;

  const handleClose = () => {
    dispatch(CLOSE_STATUS_MODAL());
  };

  const handleForceSync = () => {
    dispatch(FORCE_SYNC());
  };

  const handleClearErrors = () => {
    dispatch(CLEAR_ERRORS());
  };

  const handleTabChange = (tab: 'stats' | 'pending' | 'errors') => {
    dispatch(SET_ACTIVE_TAB(tab));
  };

  return (
    <Modal
      visible={syncStatus.isModalOpen}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Estado de Sincronización</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" width={24} height={24} fill="#333" />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, styles.statCardPending]}>
              <Text style={styles.statValue}>{syncStatus.pendingCount}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </Card>
            <Card style={[styles.statCard, styles.statCardSyncing]}>
              <Text style={styles.statValue}>{syncStatus.syncingCount}</Text>
              <Text style={styles.statLabel}>Sincronizando</Text>
            </Card>
            <Card style={[styles.statCard, styles.statCardError]}>
              <Text style={styles.statValue}>{syncStatus.errorCount}</Text>
              <Text style={styles.statLabel}>Errores</Text>
            </Card>
            <Card style={[styles.statCard, styles.statCardSuccess]}>
              <Text style={styles.statValue}>{syncStatus.syncedToday}</Text>
              <Text style={styles.statLabel}>Hoy</Text>
            </Card>
          </View>

          {/* Worker Status */}
          <View style={styles.workerStatus}>
            <View style={styles.workerStatusRow}>
              <Text style={styles.label}>Worker:</Text>
              {(() => {
                const status = syncStatus.workerStatus;
                let color = '#F5F5F5';
                let textColor = '#666666';
                
                if (status === 'running') { color = '#E3F2FD'; textColor = '#2196F3'; }
                else if (status === 'idle') { color = '#E8F5E9'; textColor = '#4CAF50'; }
                else if (status === 'error') { color = '#FFEBEE'; textColor = '#F44336'; }
                else if (status === 'paused' || status === 'stopped') { color = '#FFF3E0'; textColor = '#FF9800'; }

                return (
                  <Badge
                    content={status.toUpperCase()}
                    color={color}
                    textColor={textColor}
                  />
                );
              })()}
            </View>
            <View style={styles.workerStatusRow}>
              <Text style={styles.label}>Última sync:</Text>
              <Text style={styles.value}>{syncStatus.timeSinceLastSync}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, syncStatus.activeTab === 'stats' && styles.tabActive]}
              onPress={() => handleTabChange('stats')}
            >
              <Text style={[styles.tabText, syncStatus.activeTab === 'stats' && styles.tabTextActive]}>
                Resumen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, syncStatus.activeTab === 'pending' && styles.tabActive]}
              onPress={() => handleTabChange('pending')}
            >
              <Text style={[styles.tabText, syncStatus.activeTab === 'pending' && styles.tabTextActive]}>
                Pendientes ({model.pendingBets.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, syncStatus.activeTab === 'errors' && styles.tabActive]}
              onPress={() => handleTabChange('errors')}
            >
              <Text style={[styles.tabText, syncStatus.activeTab === 'errors' && styles.tabTextActive]}>
                Errores ({model.errorBets.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.tabContent}>
            {syncStatus.activeTab === 'stats' && (
              <View style={styles.statsContent}>
                <Text style={styles.sectionTitle}>Información del Sistema</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total sincronizado hoy:</Text>
                  <Text style={styles.infoValue}>{syncStatus.syncedToday} apuestas</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pendientes:</Text>
                  <Text style={styles.infoValue}>{syncStatus.pendingCount} apuestas</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Con errores:</Text>
                  <Text style={styles.infoValue}>{syncStatus.errorCount} apuestas</Text>
                </View>
              </View>
            )}

            {syncStatus.activeTab === 'pending' && (
              <View style={styles.listContent}>
                {model.pendingBets.length === 0 ? (
                  <Text style={styles.emptyText}>No hay apuestas pendientes</Text>
                ) : (
                  model.pendingBets.map((bet) => (
                    <Card key={bet.id} style={styles.betCard}>
                      <View style={styles.betRow}>
                        <Text style={styles.betLabel}>Sorteo:</Text>
                        <Text style={styles.betValue}>ID: {bet.id.substring(0, 8)}...</Text>
                      </View>
                      <View style={styles.betRow}>
                        <Text style={styles.betLabel}>Monto:</Text>
                        <Text style={styles.betValue}>${bet.amount?.toFixed(2)}</Text>
                      </View>
                      <View style={styles.betRow}>
                        <Text style={styles.betLabel}>Estado:</Text>
                        <Badge 
                          content={bet.status} 
                          color="#FFF3E0" 
                          textColor="#FF9800"
                        />
                      </View>
                    </Card>
                  ))
                )}
              </View>
            )}

            {syncStatus.activeTab === 'errors' && (
              <View style={styles.listContent}>
                {model.errorBets.length === 0 ? (
                  <Text style={styles.emptyText}>No hay errores</Text>
                ) : (
                  model.errorBets.map((bet) => (
                    <Card key={bet.id} style={[styles.betCard, styles.betCardError]}>
                      <View style={styles.betRow}>
                        <Text style={styles.betLabel}>ID:</Text>
                        <Text style={styles.betValue}>{bet.id.substring(0, 8)}...</Text>
                      </View>
                      <View style={styles.betRow}>
                        <Text style={styles.betLabel}>Monto:</Text>
                        <Text style={styles.betValue}>${bet.amount?.toFixed(2)}</Text>
                      </View>
                      <View style={styles.betRow}>
                        <Text style={styles.betLabel}>Error:</Text>
                        <Text style={[styles.betValue, styles.errorText]}>
                          {bet.error || 'Error desconocido'}
                        </Text>
                      </View>
                    </Card>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              status="primary"
              onPress={handleForceSync}
              disabled={syncStatus.workerStatus !== 'idle'}
              accessoryLeft={(props) => <Icon {...props} name="sync" />}
            >
              {syncStatus.workerStatus === 'running'
                ? 'Sincronizando...'
                : 'Forzar Sincronización'}
            </Button>
            
            {syncStatus.errorCount > 0 && (
              <Button status="danger" appearance="outline" onPress={handleClearErrors}>
                Limpiar Errores
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Sync Status Trigger (floating button in dashboard)
// ============================================================================

interface SyncStatusTriggerProps {
  pendingCount: number;
  onPress: () => void;
}

export const SyncStatusTrigger: React.FC<SyncStatusTriggerProps> = ({
  pendingCount,
  onPress,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pendingCount === 0) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pendingCount, scaleValue]);

  if (pendingCount === 0) return null;

  return (
    <Animated.View style={[styles.triggerContainer, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity style={styles.triggerButton} onPress={onPress}>
        <Icon name="sync" width={24} height={24} fill="white" />
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {pendingCount > 99 ? '99+' : pendingCount}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// Main View Component
// ============================================================================

interface OfflineSyncViewProps {
  model: OfflineSyncModel;
  dispatch: (msg: OfflineSyncMsg) => void;
}

const OfflineSyncView: React.FC<OfflineSyncViewProps> = ({ model, dispatch }) => {
  const handleDismissToast = (id: string) => {
    dispatch(HIDE_TOAST({ id }));
  };

  const handleOpenModal = () => {
    dispatch(OPEN_STATUS_MODAL());
  };

  return (
    <>
      {/* Toast Container */}
      <ToastContainer toasts={model.toasts} onDismiss={handleDismissToast} />
      
      {/* Sync Status Screen */}
      <SyncStatusScreen model={model} dispatch={dispatch} />
      
      {/* Floating Trigger (for external use) */}
      <SyncStatusTrigger
        pendingCount={model.syncStatus.pendingCount}
        onPress={handleOpenModal}
      />
    </>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Toast styles
  toastOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
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
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
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
  actionButton: {
    marginTop: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statCardPending: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  statCardSyncing: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  statCardError: {
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  statCardSuccess: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },

  // Worker status
  workerStatus: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  workerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#666',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },

  // Tab content
  tabContent: {
    maxHeight: 250,
    padding: 12,
  },
  statsContent: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },

  // List content
  listContent: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  betCard: {
    marginBottom: 8,
    padding: 12,
  },
  betCardError: {
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  betRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  betLabel: {
    fontSize: 12,
    color: '#666',
  },
  betValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  errorText: {
    color: '#F44336',
    maxWidth: '60%',
    textAlign: 'right',
  },

  // Actions
  actions: {
    padding: 16,
    gap: 8,
  },

  // Trigger (floating button)
  triggerContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  triggerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    flexDirection: 'row',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default OfflineSyncView;
