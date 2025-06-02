import React from 'react';

import { useLocalSearchParams } from 'expo-router';
import BetEditScreen from '@/features/listero/views/bets/edit_list';

export default function ListerBetsScreen({
    drawId
}:any) {
  const { id } = useLocalSearchParams();

  return (
      <BetEditScreen />
  );
}
