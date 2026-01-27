import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Layout } from '@ui-kitten/components';
import { useNetwork } from '../hooks/use_network';
import { OfflineStorage, PendingBet } from '../services/offline_storage';
import { BetService } from '../services/bet';

export const SyncManager: React.FC = () => {
  const { isOnline } = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkPendingBets = async () => {
    const bets = await OfflineStorage.getPendingBets();
    setPendingCount(bets.length);
    return bets;
  };

  const syncBets = async () => {
    if (isSyncing || !isOnline) return;

    const bets = await checkPendingBets();
    if (bets.length === 0) return;

    setIsSyncing(true);
    console.log(`Starting sync for ${bets.length} bets...`);

    for (const bet of bets) {
      try {
        // Quitamos campos temporales de offline antes de enviar
        const { offlineId, timestamp, ...betData } = bet;
        await BetService.create(betData);
        await OfflineStorage.removePendingBet(offlineId);
        console.log(`Synced bet ${offlineId}`);
      } catch (error) {
        console.error(`Failed to sync bet ${bet.offlineId}:`, error);
        // Si falla (ej: sorteo cerrado), podrías decidir si borrarla o dejarla
      }
    }

    await checkPendingBets();
    setIsSyncing(false);
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
