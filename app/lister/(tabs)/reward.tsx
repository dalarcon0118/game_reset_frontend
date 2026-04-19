import React from 'react';
import { RewardProvider, PrizesScreen } from '@/features/listero/reward';

export default function RewardsPage() {
  return (
    <RewardProvider>
      <PrizesScreen />
    </RewardProvider>
  );
}
