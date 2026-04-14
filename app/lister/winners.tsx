import React from 'react';
import { WinningProvider, WinnersScreen } from '@/features/listero/winning';

export default function WinnersPage() {
  return (
    <WinningProvider>
      <WinnersScreen />
    </WinningProvider>
  );
}
