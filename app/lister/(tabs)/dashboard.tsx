import {  StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import DashboardScreenComponent from '@/features/listero/listero-dashboard/views';
import { ListeroDashboardProvider } from '@/features/listero/listero-dashboard/core/store_context';


export default function ListeroDashboardTab() {
  const colorScheme = useColorScheme() ?? 'light';


  return (
    <ListeroDashboardProvider>
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background }
      ]}>
        <DashboardScreenComponent/>

      </SafeAreaView>
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
