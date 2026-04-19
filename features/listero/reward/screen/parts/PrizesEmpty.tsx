import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Award } from 'lucide-react-native';

export const PrizesEmpty = ({ theme, insets }: { theme: any; insets: any }) => (
  <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
    </View>
    <View style={styles.centered}>
      <Award size={48} color={theme.textTertiary} />
      <Text category="h6" style={styles.emptyText}>
        Sin premios disponibles
      </Text>
      <Text category="p1" appearance="hint" style={styles.emptySubtext}>
        No hay tipos de apuesta configurados para tu estructura
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
  emptyText: {
    marginTop: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
