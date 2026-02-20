import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary as ExpoErrorBoundary } from 'expo-router';
import { logger } from '../shared/utils/logger';

export const GlobalErrorBoundary = (props: any) => {
  useEffect(() => {
    if (props.error) {
      logger.error('Expo Router ErrorBoundary caught an error', 'ROUTER', props.error);
    }
  }, [props.error]);

  // If there's an error, we can render a custom fallback UI here if we wanted to override Expo's default
  // But for now, we'll wrap Expo's boundary to add logging
  
  if (props.error) {
     return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error Crítico de Aplicación</Text>
        <Text style={styles.errorMessage}>{String(props.error)}</Text>
        <ExpoErrorBoundary {...props} />
      </View>
    );
  }

  return <ExpoErrorBoundary {...props} />;
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  errorMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
});
