import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RewardScreen } from '@/features/listero/bet-workspace/rewards/screen/reward';

export default function RewardsPage() {
  const { id, title } = useLocalSearchParams();
  return <RewardScreen drawId={id as string} title={title as string} />;
}