import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, Text as RNText, useColorScheme, LayoutChangeEvent } from 'react-native';
import { Text } from '@ui-kitten/components';
import Colors from '@/constants/colors';
import { DrawTypeSection } from '../components/DrawTypeSection';

const ESTIMATED_ITEM_HEIGHT = 200;

export const PrizesList = ({ drawTypes, bankName }: { drawTypes: any[]; bankName: string | null }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: ESTIMATED_ITEM_HEIGHT,
    offset: ESTIMATED_ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
        <RNText style={{ color: theme.textSecondary, fontSize: 14 }}>
          {bankName}
        </RNText>
      </View>

      <FlatList
        data={drawTypes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <DrawTypeSection drawType={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.textSecondary, fontSize: 16, textAlign: 'center' }}>
              No hay sorteos con premios configurados
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  empty: {
    padding: 48,
    alignItems: 'center',
  },
});