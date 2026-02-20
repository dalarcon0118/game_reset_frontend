import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Layout } from '@ui-kitten/components';
import { useNetwork } from '../hooks/use_network';
import { OfflineFinancialService } from '../services/offline';
import { logger } from '../utils/logger';

const log = logger.withTag('SYNC_MANAGER');

export const SyncManager: React.FC = () => {
  const { isOnline } = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkPendingBets = async () => {
    try {
        const bets = await OfflineFinancialService.getPendingBets();
        setPendingCount(bets.length);
        return bets;
    } catch (e) {
        log.error('Error checking pending bets', e);
        return [];
    }
  };

  const syncBets = async () => {
    log.debug('syncBets called', { isSyncing, isOnline });
    if (isSyncing || !isOnline) return;

    const bets = await checkPendingBets();
    if (bets.length === 0) return;

    setIsSyncing(true);
    log.info(`Starting sync for ${bets.length} bets...`);
    
    // V2 handles sync automatically via worker when online.
    // We can just wait a bit and refresh the count.
    
    setTimeout(async () => {
        await checkPendingBets();
        setIsSyncing(false);
    }, 3000);
  };

  useEffect(() => {
    checkPendingBets();
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncBets();
    }
  }, [isOnline]);

  if (pendingCount === 0) return null;

  return (
    <Layout style={styles.container} level="4">
      <View style={styles.content}>
        <Icon 
          name={isOnline ? "cloud-upload-outline" : "cloud-off-outline"} 
          fill={isOnline ? "#3366FF" : "#FF3D71"}
          style={styles.icon}
        />
        <Text category="c1" style={styles.text}>
          {isSyncing 
            ? 'Sincronizando apuestas...' 
            : `${pendingCount} apuesta(s) pendiente(s) ${isOnline ? '' : '(Sin conexión)'}`}
        </Text>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  text: {
    fontWeight: 'bold',
  },
});
