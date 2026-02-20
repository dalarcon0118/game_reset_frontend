import React from 'react';
import { RulesScreen } from '@/features/bet-workspace/rules/screens/rules_screen';
import { useLocalSearchParams } from 'expo-router';

export default function RewardsPage() {
  const { id } = useLocalSearchParams();
  // Using RulesScreen as it displays both rules and rewards
  return <RulesScreen drawId={id as string} />;
}
