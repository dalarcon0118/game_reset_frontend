import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Layout } from '@ui-kitten/components';
import { useNetwork } from '../hooks/use_network';
import { betRepository } from '../repositories/bet';
import { syncWorker } from '../core/offline-storage/instance';
import { logger } from '../utils/logger';

const log = logger.withTag('SYNC_MANAGER');

export const SyncManager: React.FC = () => {
  const { isOnline } = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkPendingBets = async () => {
    try {
        const bets = await betRepository.getPendingBets();
        setPendingCount(bets.length);
        if (bets.length === 0) setLastError(null);
        return bets;
    } catch (e) {
        log.error('Error checking pending bets', e);
        return [];
    }
  };

  const syncBets = async () => {
    log.debug('syncBets called', { isSyncing, isOnline });
    if (isSyncing || !isOnline) return;

    setLastError(null);
    const bets = await checkPendingBets();
    if (bets.length === 0) return;

    setIsSyncing(true);
    log.info(`Starting sync for ${bets.length} bets...`);
    
    // V2 handles sync manually.
    const report = await syncWorker.triggerSync();
    log.info('Sync finished', report);
    
    if (report.status === 'FAILED' || report.status === 'PARTIAL') {
        const firstError = report.errors[0]?.reason || 'Error desconocido';
        setLastError(firstError);
    }
    
    await checkPendingBets();
    setIsSyncing(false);
  };

  useEffect(() => {
    checkPendingBets();
  }, []);

  if (pendingCount === 0) return null;

  return (
    <Layout style={[styles.container, lastError ? styles.errorContainer : styles.pendingContainer]} level="4">
      <View style={styles.content}>
        <Icon 
          name={isOnline ? (isSyncing ? "refresh-outline" : "cloud-upload-outline") : "cloud-off-outline"} 
          fill={lastError ? "#FF3D71" : (isOnline ? "#3366FF" : "#FF3D71")}
          style={[styles.icon, isSyncing && styles.rotatingIcon]}
          onPress={() => !isSyncing && isOnline && syncBets()}
        />
        <View style={styles.textContainer}>
          <Text 
            category="c1" 
            style={[styles.text, lastError && styles.errorText]}
            onPress={() => !isSyncing && isOnline && syncBets()}
          >
            {isSyncing 
              ? 'Sincronizando apuestas...' 
              : lastError 
                ? `Error: ${lastError} (Reintentar)`
                : `${pendingCount} apuesta(s) pendiente(s) ${isOnline ? '(Toca para sincronizar)' : '(Sin conexión)'}`}
          </Text>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E4E9F2',
  },
  pendingContainer: {
    backgroundColor: '#F7F9FC',
  },
  errorContainer: {
    backgroundColor: '#FFF1F1',
    borderTopColor: '#FF3D71',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flexShrink: 1,
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  rotatingIcon: {
    // Note: Animation would need a separate Animated.Value, but we add the style for clarity
  },
  text: {
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3D71',
  },
});
