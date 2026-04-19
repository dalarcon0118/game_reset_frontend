import React, { useMemo } from 'react';
import {  StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import DashboardScreenComponent from '@/features/listero/listero-dashboard/views';
import { ListeroDashboardProvider } from '@/features/listero/listero-dashboard/core/store_context';
import { CoreModule } from '@/core/core_module';
import { RewardModule } from '@/features/listero/reward/core/store';

export default function ListeroDashboardTab() {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Leemos la verdad del sistema desde el Kernel (CoreModule)
  const isSystemReady = CoreModule.useStore(s => s.model.isSystemReady);

  // Memoizamos los parámetros para evitar recreación innecesaria del store
  const initialParams = useMemo(() => ({ isSystemReady }), [isSystemReady]);

  return (
    <ListeroDashboardProvider initialParams={initialParams}>
      <RewardModule.Provider>
        <SafeAreaView style={[
          styles.container,
          { backgroundColor: Colors[colorScheme].background }
        ]}>
          <DashboardScreenComponent/>

        </SafeAreaView>
      </RewardModule.Provider>
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
