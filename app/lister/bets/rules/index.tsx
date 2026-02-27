import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RulesScreen } from "@/features/listero/bet-workspace/rules/screens/rules_screen"
export default function BetsRulesPage() {
  const { id } = useLocalSearchParams();
  return <RulesScreen drawId={id as string} />;
}
