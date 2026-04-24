import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { ScreenContainer } from '@/shared/components';
import DashboardScreenComponent from '@/features/listero/listero-dashboard/views';
import { ListeroDashboardProvider } from '@/features/listero/listero-dashboard/core/store_context';
import { CoreModule } from '@/core/core_module';
import { RewardModule } from '@/features/listero/reward/core/store';
import { WinningProvider } from '@/features/listero/winning';

export default function ListeroDashboardTab() {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Leemos la verdad del sistema desde el Kernel (CoreModule)
  const isSystemReady = CoreModule.useStore(s => s.model.isSystemReady);

  // Memoizamos los parámetros para evitar recreación innecesaria del store
  const initialParams = useMemo(() => ({ isSystemReady }), [isSystemReady]);

  return (
    <ListeroDashboardProvider initialParams={initialParams}>
      <WinningProvider>
        <RewardModule.Provider>
          <ScreenContainer
            edges={['top', 'left', 'right', 'bottom']}
            backgroundColor={Colors[colorScheme].background}
            style={styles.container}
          >
            <DashboardScreenComponent/>
          </ScreenContainer>
        </RewardModule.Provider>
      </WinningProvider>
    </ListeroDashboardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
});
