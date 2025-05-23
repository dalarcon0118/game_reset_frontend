import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import StyledText from '@/components/typography/StyledText'; // Assuming you have this component
import CreateBetScreen from '@/features/listero/views/bets/create_bet';
import { useLocalSearchParams } from 'expo-router';

export default function ListerBetsScreen({
    drawId
}:any) {
  const colorScheme = useColorScheme() ?? 'light';
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <CreateBetScreen drawId={id}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  title: {
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
});