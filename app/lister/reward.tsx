import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import RewardScreen from '@/features/listero/bet-workspace/rewards/screen/reward';

export default function RewardsPage() {
  const { id } = useLocalSearchParams();
  // Using RulesScreen as it displays both rules and rewards
  return <RewardScreen drawId={id as string} />;
}
