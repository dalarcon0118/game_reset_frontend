import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import BolitaEntryScreen from '@/features/listero/bet-bolita/ui/screens/bolita_entry_screen';

export default function ListerBetsCreateScreen() {
  const { id, title } = useLocalSearchParams();

  return (
    <BolitaEntryScreen
      drawId={id as string}
      title={title as string}
    />
  );
}
