import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { AlertTriangle, Home } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StyledText from '@/components/typography/StyledText';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

export default function ErrorScreen() {
  const { message } = useLocalSearchParams<{ message: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AlertTriangle 
        size={64} 
        color={Colors.light.error}
        style={styles.icon}
      />
      <StyledText 
        variant="h1" 
        style={styles.title}
      >
        ¡Ups! Algo salió mal
      </StyledText>
      <StyledText 
        variant="body" 
        style={styles.message}
      >
        {message || 'Se ha producido un error inesperado.'}
      </StyledText>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.replace('/login')}
      >
        <Home size={20} color="#fff" />
        <StyledText variant="body" style={styles.buttonText}>
          Volver al Inicio
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: '#fff',
  },
  icon: {
    marginBottom: Layout.spacing.md,
  },
  title: {
    marginBottom: Layout.spacing.sm,
    color: Colors.light.error,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: Layout.spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary || '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});