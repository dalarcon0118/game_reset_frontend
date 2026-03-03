import React from 'react';
import { GameLoader } from '@/features/listero/bet-workspace/ui/components/GameLoader';
import { useLocalSearchParams } from 'expo-router';

export default function BetsListPage() {
  const { id, title } = useLocalSearchParams();
  return (
    <GameLoader
      drawId={id as string}
      title={title as string}
      mode="list"
    />
  );
}
