import React from 'react';

import { useLocalSearchParams } from 'expo-router';
import BetEditScreen from '@/features/listero/bets/views/edit_list';

export default function ListerBetsScreen({
  drawId
}: any) {
  const { id,title } = useLocalSearchParams();

  return (
    <BetEditScreen drawId={id} title={title} />
  );
}
