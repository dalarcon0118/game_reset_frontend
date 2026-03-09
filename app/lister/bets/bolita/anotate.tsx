import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import BolitaEntryScreen from '@/features/listero/bet-bolita/presentation/screens/bolita_entry_screen';
import { BolitaStoreProvider } from '@/features/listero/bet-bolita/presentation/store';

export default function ListerBetsCreateScreen() {
  const { id, title } = useLocalSearchParams();

  return (
    <BolitaStoreProvider>
      <BolitaEntryScreen
        drawId={id as string}
        title={title as string}
      />
    </BolitaStoreProvider>
  );
}
