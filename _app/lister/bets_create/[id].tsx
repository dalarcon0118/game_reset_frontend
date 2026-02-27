import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GameLoader } from '@/_legacy/workspace/games/game_loader';

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
