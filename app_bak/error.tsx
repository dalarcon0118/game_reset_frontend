import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import StyledText from '@/components/typography/StyledText';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

interface ErrorScreenProps {
  message: string;
}

export default function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <AlertTriangle 
        size={64} 
        color={Colors.light.error}
        style={styles.icon}
      />
      <StyledText 
        variant="body" 
        style={styles.message}
      >
        {message}
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  icon: {
    marginBottom: Layout.spacing.md,
  },
  message: {
    textAlign: 'center',
    color: Colors.light.error,
  },
});