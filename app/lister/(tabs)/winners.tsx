import React from 'react';
import { WinnersScreen, WinningProvider } from '@/features/listero/winning';

export default function WinnersPage() {
  return (
    <WinningProvider>
      <WinnersScreen />
    </WinningProvider>
  );
}
