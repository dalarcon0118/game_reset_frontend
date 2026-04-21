import React from 'react';
import { TodosProvider, MisGanadoresProvider } from '@/features/listero/winning';
import { WinnersScreen } from '@/features/listero/winning';

export default function WinnersPage() {
  return (
    <TodosProvider>
      <MisGanadoresProvider>
        <WinnersScreen />
      </MisGanadoresProvider>
    </TodosProvider>
  );
}