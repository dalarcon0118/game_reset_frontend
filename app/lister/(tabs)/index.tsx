import { useState } from 'react';
import {  StyleSheet, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { DashboardScreen as ListeroDashboard } from '../../../features/listero';


export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';



  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: Colors[colorScheme].background }
    ]}>
      <ListeroDashboard/>

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
