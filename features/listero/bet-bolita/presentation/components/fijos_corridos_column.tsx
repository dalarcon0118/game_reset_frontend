import React from 'react';
import { View, StyleSheet } from 'react-native';
import AmountCircle from '@/shared/components/bets/amount_circle';
import BetCircle from '@/shared/components/bets/bet_circle';
import { FijosCorridosBet } from '@/types';
import BottomDrawer from '@/components/ui/bottom_drawer';
import Layout from '@/constants/layout';
import { useFijos } from '../hooks/use_fijos';
import { BetNumericKeyboard, AmountNumericKeyboard } from '@/shared/components/bets/numeric_keyboard';
import { logger } from '@/shared/utils/logger';

import { BET_TYPE_KEYS } from '@/shared/types/bet_types';

const log = logger.withTag('FIJOS_CORRIDOS_COLUMN');

interface FijosCorridosColumnProps {
    editable?: boolean;
    data?: FijosCorridosBet[];
}

export default function FijosCorridosColumn({ editable = false, data }: FijosCorridosColumnProps) {
    const {
        fijosCorridosList: hookList,
        showBetKeyboard,
        showAmountKeyboard,
        editingAmountType,
        currentInput,
        handleAddBetPress,
        handleAmountCirclePress,
        hideBetKeyboard,
        hideAmountKeyboard,
        handleKeyPress,
        handleConfirmInput,
    } = useFijos();

    const fijosCorridosList = data || hookList;

    log.debug('Rendering component', { listLength: fijosCorridosList?.length });


  const renderKeyboard = () => {
    const isVisible = showBetKeyboard || (showAmountKeyboard && (editingAmountType === 'fijo' || editingAmountType === 'corrido'));
    const onClose = showBetKeyboard ? hideBetKeyboard : hideAmountKeyboard;

    if (!isVisible) return null;

    log.debug('Rendering Keyboard', { showBetKeyboard, showAmountKeyboard, editingAmountType, isVisible });

    return (
      <BottomDrawer isVisible={isVisible} onClose={onClose} title='' height={"60%"}>
        {showBetKeyboard ? (
          <BetNumericKeyboard
            onKeyPress={handleKeyPress}
            onConfirm={handleConfirmInput}
            currentInput={currentInput}
            betType={BET_TYPE_KEYS.FIJO_CORRIDO}
          />
        ) : (
          <AmountNumericKeyboard
            onKeyPress={handleKeyPress}
            onConfirm={handleConfirmInput}
            currentInput={currentInput}
          />
        )}
      </BottomDrawer>
    );
  };
 const renderBets =() =>(
  fijosCorridosList.map((item: FijosCorridosBet) => (
          <View key={item.id} style={styles.fijoRow}>
            <BetCircle 
              value={item.bet.toString().padStart(2, '0')} 
            />
            <AmountCircle
              amount={item.fijoAmount}
              onPress={editable ? () => handleAmountCirclePress(item.id, 'fijo') : undefined}
            />
            <AmountCircle
              amount={item.corridoAmount}
              onPress={editable ? () => handleAmountCirclePress(item.id, 'corrido') : undefined}
            />
          </View>
        ))
      )

  return (
    <View style={[styles.column, styles.colFijos]}>
      <View style={styles.columnContent}>
        {renderBets()}
        {editable && (
          <View style={styles.fijoRow}>
            <BetCircle 
              value={"+"} 
              onPress={() => {
                log.debug('BetCircle + pressed');
                handleAddBetPress?.();
              }} 
            />
            <AmountCircle amount={null} onPress={() => {}} />
            <AmountCircle amount={null} onPress={() => {}} />
          </View>
        )}
      </View>
      {editable && renderKeyboard()}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    paddingTop: 12
  },
  colFijos: {
    flex: 3,
    paddingHorizontal: Layout.spacing.xs,
  },
  columnContent: {
    paddingVertical: Layout.spacing.xs,
  },
  fijoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
  },
  fijoBetText: {
    width: 30,
    textAlign: 'right',
    marginRight: Layout.spacing.xs,
  },
});
