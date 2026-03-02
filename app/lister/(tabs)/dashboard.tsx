import {  StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import DashboardScreen from '@/features/listero/listero-dashboard/views';


export default function ListeroDashboardTab() {
  const colorScheme = useColorScheme() ?? 'light';


  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: Colors[colorScheme].background }
    ]}>
      <DashboardScreen/>

    </SafeAreaView>
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