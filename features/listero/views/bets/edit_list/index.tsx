import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

import { mockFijosCorridos, mockParlets, mockCentenas } from '@/data/mockData';
import ColumnHeaders from './components/ColumnHeaders';
import FijosCorridosColumn from './components/FijosCorridosColumn';
import ParletColumn from './components/ParletColumn';
import CentenasColumn from './components/CentenasColumn';
import { FijosCorridosBet } from '@/types';
import LayoutConstants from '@/constants/Layout';
import { Layout, Text, Card, Button, useTheme } from '@ui-kitten/components';
import { useParlet } from './components/hooks/useParlet';
import useDataFetch from '@/shared/hooks/useDataFetch';
import { BetService } from '@/shared/services/Bet';
import { DrawService } from '@/shared/services/Draw';

interface BetsListScreenProps {
  drawId?: string;
  title?: string;
}


export default function BetsListScreen({ 
  drawId,
  title
}: BetsListScreenProps) {

  const colorScheme = useColorScheme() ?? 'light';

  const [fijosCorridosList, setFijosCorridosList] = useState<FijosCorridosBet[]>([]);
  const [saveBet, savebetResponse, isLoadingBet, errorBet, saveBetVersion] = useDataFetch(BetService.create);
  const [filteredBetsTypeByDrawId, betTypes, isLoadingBets, errorBets] = useDataFetch(DrawService.filterBetsTypeByDrawId);

  const [fijoBetTypeId, setFijoBetTypeId] = useState<string | null>(null);
  const [corridoBetTypeId, setCorridoBetTypeId] = useState<string | null>(null);
  const [parletBetTypeId, setParletBetTypeId] = useState<string | null>(null);
  const [centenaBetTypeId, setCentenaBetTypeId] = useState<string | null>(null);



  const { parletList } = useParlet();


  const onSelectPlay = useCallback((plays: FijosCorridosBet[]) => {
    const uniqueBets = [...new Map(plays.map(item => [item.bet, item])).values()];
    setFijosCorridosList(prev => prev === uniqueBets ? prev : uniqueBets);
  }, []);

  useEffect(() => {
    if (drawId) {
      filteredBetsTypeByDrawId(drawId);
    }
  }, [drawId]);

  useEffect(() => {
    if (betTypes && Array.isArray(betTypes)) {
      console.log('betTypes:', betTypes);
      //fiiltra los betTypes por nombre para encontrar el betType Id
      const FijoBetTypeId = betTypes.find(betType => betType.code === 'FIJO')?.id;
      const CorridoBetTypeId = betTypes.find(betType => betType.code === 'CORRIDO')?.id;
      const ParletBetTypeId = betTypes.find(betType => betType.code === 'PARLET')?.id;
      const CentenaBetTypeId = betTypes.find(betType => betType.code === 'CENTENA')?.id;
      setFijoBetTypeId(FijoBetTypeId ?? null);
      setCorridoBetTypeId(CorridoBetTypeId ?? null);
      setParletBetTypeId(ParletBetTypeId ?? null);
      setCentenaBetTypeId(CentenaBetTypeId ?? null);
    }
  }, [betTypes]);

  // Use versionKey to ensure this effect fires every time there's a new successful response
  useEffect(() => {
    console.log('useEffect ejecutado - saveBetVersion:', saveBetVersion);
    console.log('useEffect ejecutado - savebetResponse:', savebetResponse);
    if (savebetResponse) {
      Alert.alert(
        'Apuestas Guardadas',
        'Las apuestas han sido guardadas exitosamente.',
        [{ text: 'OK' }]
      );
    }
  }, [saveBetVersion]); // Changed from savebetResponse to saveBetVersion

  const handleSave = () => {
    // Logic to save bets - combine all selected bets
    const allBets = {
      fijosCorridos: [...fijosCorridosList, { fijoBetTypeId }],
      parlets: [...parletList, { parletBetTypeId }],
      centenas: [...mockCentenas, { centenaBetTypeId }],
      drawId: drawId
    };
    
    saveBet(allBets);
    console.log('Guardando apuestas:', allBets);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['bottom']}>
      <Layout style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]} level='1'>
        <Text category='h6' style={styles.header}>{title}</Text>
      </Layout>
      <ColumnHeaders />
      <ScrollView style={[styles.scrollContainer, (fijosCorridosList.length > 0 || parletList.length > 0) && styles.scrollWithFooter]}>
        <View style={styles.betContainer}>
          <View style={styles.gridContainer}>
            <FijosCorridosColumn onSelectPlay={onSelectPlay} betTypeId={fijoBetTypeId} />
            <ParletColumn fijosCorridosList={fijosCorridosList} betTypeId={parletBetTypeId} />
            <CentenasColumn bets={mockCentenas} betTypeId={centenaBetTypeId} />
          </View>
        </View>

      </ScrollView>
      {(fijosCorridosList.length > 0 || parletList.length > 0) && (
        <Layout style={[styles.footerBar, { borderTopColor: Colors[colorScheme].border }]} level='1'>
          <Button
            status='primary'
            onPress={handleSave}
            size="medium"
            style={styles.footerButton}
          >
            Salvar
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
  betsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: LayoutConstants.spacing.lg,
    justifyContent: 'flex-end',
  },
  saveButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderStyle: 'solid',
    paddingHorizontal: LayoutConstants.spacing.sm,
    paddingVertical: LayoutConstants.spacing.xs,
    borderRadius: LayoutConstants.borderRadius.sm,
    marginTop: LayoutConstants.spacing.sm,
    marginBottom: LayoutConstants.spacing.sm,
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
  buttonSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: LayoutConstants.spacing.lg,
    justifyContent: 'space-between',
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
