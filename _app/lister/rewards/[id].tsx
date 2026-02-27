import React from 'react';
import { RewardScreen } from '@/features/listero/bet-workspace/rewards/screen/reward';
import { useLocalSearchParams } from 'expo-router';

export default function RewardsPage() {
  const { id } = useLocalSearchParams();
  return <RewardScreen drawId={id as string} />;
}
