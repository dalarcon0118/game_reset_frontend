import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';

export const PrizesError = ({ theme, insets, onRetry }: { theme: any; insets: any; onRetry: () => void }) => (
  <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>Tabla de Premios</Text>
    </View>
    <View style={styles.centered}>
      <Info size={48} color={theme.error} />
      <Text style={[styles.errorText, { color: theme.error, fontSize: 16 }]}>
        Error al cargar premios
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={onRetry}
      >
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
