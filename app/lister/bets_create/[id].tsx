import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EditListScreen } from '@/features/listero/bets/screens/EditListScreen';

export default function ListerBetsScreen() {
  const { id, title } = useLocalSearchParams();

  return (
    <EditListScreen
      drawId={id as string}
      title={title as string}
    />
  );
}
