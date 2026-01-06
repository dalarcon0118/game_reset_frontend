import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../../../../constants/Colors';

import ColumnHeaders from './components/ColumnHeaders';
import FijosCorridosColumn from './components/FijosCorridosColumn';
import ParletColumn from './components/ParletColumn';
import CentenasColumn from './components/CentenasColumn';
import LayoutConstants from '../../../../../constants/Layout';
import { Layout, Text, Button } from '@ui-kitten/components';
import { useBets } from '../../hooks/useBets';

interface BetsListScreenProps {
  drawId?: string;
  title?: string;
}

export default function BetsListScreen({ 
  drawId,
  title
}: BetsListScreenProps) {

  const colorScheme = useColorScheme() ?? 'light';
  
  const {
    fijosCorridos,
    parlets,
    isLoading,
    isSaving,
    saveSuccess,
    error,
    fetchBetTypes,
    saveBets,
    resetBets
  } = useBets();

  useEffect(() => {
    if (drawId) {
      fetchBetTypes(drawId);
    }
  }, [drawId, fetchBetTypes]);

  useEffect(() => {
    if (saveSuccess) {
      Alert.alert(
        'Apuestas Guardadas',
        'Las apuestas han sido guardadas exitosamente.',
        [{ text: 'OK', onPress: resetBets }]
      );
    }
  }, [saveSuccess, resetBets]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleSave = () => {
    if (drawId) {
      saveBets(drawId);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
      <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
        <Text category='h6' style={styles.headerText}>{title}</Text>
      </Layout>
      <ColumnHeaders />
      <ScrollView style={[styles.scrollContainer, (fijosCorridos.length > 0 || parlets.length > 0) && styles.scrollWithFooter]}>
        <View style={styles.betContainer}>
          <View style={styles.gridContainer}>
            <FijosCorridosColumn />
            <ParletColumn fijosCorridosList={fijosCorridos} />
            <CentenasColumn />
          </View>
        </View>
      </ScrollView>
      {(fijosCorridos.length > 0 || parlets.length > 0) && (
        <Layout style={[styles.footerBar, { borderTopColor: Colors[colorScheme].border }]} level='1'>
          <Button
            status='primary'
            onPress={handleSave}
            size="medium"
            disabled={isSaving}
            style={styles.footerButton}
          >
            {isSaving ? 'Guardando...' : 'Salvar'}
          </Button>
        </Layout>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    paddingVertical: LayoutConstants.spacing.xs,
    paddingHorizontal: LayoutConstants.spacing.xs,
    borderBottomWidth: 1,
  },
  headerText: {
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: LayoutConstants.spacing.xl * 2,
  },
  scrollWithFooter: {
    paddingBottom: LayoutConstants.spacing.xl * 4,
  },
  betContainer: {
    flexDirection: "column"
  },
  gridContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: LayoutConstants.spacing.md,
    paddingVertical: LayoutConstants.spacing.sm,
  },
  footerButton: {
    width: '100%',
  }
});
