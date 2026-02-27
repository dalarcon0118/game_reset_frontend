import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import LoteriaEntryScreen from '@/features/listero/bet-loteria/screens/loteria_entry_screen';

export default function ListerBetsCreateScreen() {
  const { id, title } = useLocalSearchParams();

  return (
    <LoteriaEntryScreen
      drawId={id as string}
      title={title as string}
    />
  );
}
