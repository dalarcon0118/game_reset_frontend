import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GameLoader } from '@/features/listero/bet-workspace/ui/components/GameLoader';

export default function ListerBetsCreateScreen() {
  const { id, title } = useLocalSearchParams();

  return (
    <GameLoader
      drawId={id as string}
      title={title as string}
      mode="entry"
    />
  );
}
