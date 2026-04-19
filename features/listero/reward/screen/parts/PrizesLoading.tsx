import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const PrizesLoading = ({ theme, insets }: { theme: any; insets: any }) => (
  <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
    </View>
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text category="s1" style={[styles.loadingText, { color: theme.textSecondary }]}>
        Cargando premios...
      </Text>
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
  loadingText: {
    marginTop: 16,
  },
});
