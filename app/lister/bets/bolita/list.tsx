import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolitaListPlays from '@/features/listero/bet-bolita/ui/screens/bolita_list_plays';
import { Text, View } from 'react-native';

export default function BetsListPage() {
  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (!id) {
      console.warn('[BetsListPage] Missing drawId param');
      // Opcional: Redirigir atrás si no hay ID
      // router.back();
    }
  }, [id]);

  if (!id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Error: Identificador de sorteo no válido</Text>
      </View>
    );
  }

  return (
    <BolitaListPlays drawId={id as string} />
  );
}
