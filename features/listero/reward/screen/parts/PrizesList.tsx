import React from 'react';
import { View, StyleSheet, FlatList, Text as RNText } from 'react-native';
import { Text } from '@ui-kitten/components';
import { DrawTypeSection } from '../components/DrawTypeSection';

export const PrizesList = ({ drawTypes, bankName, theme }: { drawTypes: any[]; bankName: string | null; theme: any }) => (
  <View style={styles.container}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
      <RNText style={{ color: '#666666', fontSize: 14 }}>
        {bankName}
      </RNText>
    </View>

    <FlatList
      data={drawTypes}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <DrawTypeSection drawType={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ color: '#666666', fontSize: 16, textAlign: 'center' }}>
            No hay sorteos con premios configurados
          </Text>
        </View>
      }
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24, // Consistent with card padding
    paddingVertical: 20, // More breathing room
    borderBottomWidth: 1,
    marginBottom: 8, // Small separation before content
  },
  list: {
    paddingHorizontal: 20, // Consistent horizontal padding
    paddingVertical: 16, // Vertical padding for breathing room
  },
  empty: {
    padding: 48, // More padding for empty state
    alignItems: 'center',
  },
});
