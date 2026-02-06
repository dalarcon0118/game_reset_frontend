import React from 'react';
import { RulesScreen } from '@/features/listero/bets/screens/rules_screen';
import { useLocalSearchParams } from 'expo-router';

export default function BetsRulesPage() {
  const { id } = useLocalSearchParams();
  return <RulesScreen drawId={id as string} />;
}
