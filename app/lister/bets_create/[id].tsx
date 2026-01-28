import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EditListScreen } from '@/features/listero/bets/screens/edit_list_screen';

export default function ListerBetsScreen() {
  const { id, title } = useLocalSearchParams();

  return (
    <EditListScreen
      drawId={id as string}
      title={title as string}
    />
  );
}
