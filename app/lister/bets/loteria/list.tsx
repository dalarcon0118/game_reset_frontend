import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import LoteriaListPlays from '@/features/listero/bet-loteria/screens/loteria_list_plays';

export default function BetsListPage() {
  const { id, title } = useLocalSearchParams();
  return (
    <LoteriaListPlays
      drawId={id as string}
    />
  );
}
