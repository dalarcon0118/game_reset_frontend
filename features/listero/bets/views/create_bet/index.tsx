import React, { useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Layout,
  Text,
  Input,
  Radio,
  RadioGroup,
  Button,
} from '@ui-kitten/components';

import { mockDraws, mockGameTypes, commonAmounts } from '../../../../../data/mockData';

import { isValidBetNumbers, getMaxLength } from '../../../../../utils/betUtils';
import { GameTypeCodes } from '../../../../../constants/Bet';
import NumberDisplay from '../edit_list/components/NumberDisplay';
import CustomNumericKeyboard from './CustomNumericKeyboard';
import QuickAmountButtons from './QuickAmountButtons';
import BetSummary from './BetSummary';
import { useBets } from '../../hooks/useBets';

export default function CreateBetScreen({
  drawId
}: { drawId: string }) {
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
    createSession,
    setCreateGameType,
    updateCreateNumbers,
    updateCreateAmount,
    addBetToCreateList,
    clearCreateSession,
    handleKeyPress,
    handleAmountSelection,
    validateAndAddBet,
    submitCreateSession,
    confirmClearBets
  } = useBets();

  const {
    selectedGameType,
    numbersPlayed,
    amount,
    tempBets
  } = createSession;

  // Selected game type index for RadioGroup
  const selectedGameTypeIndex = mockGameTypes.findIndex(t => t.id === selectedGameType?.id);
  const safeSelectedGameTypeIndex = selectedGameTypeIndex === -1 ? 0 : selectedGameTypeIndex;

  // Handle adding a bet
  const handleAddBet = () => {
    validateAndAddBet(drawId);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    submitCreateSession();
  };

  // Handle clearing all bets
  const handleClearBets = () => {
    if (tempBets.length > 0) {
      Alert.alert(
        'Confirmar',
        '¿Está seguro que desea limpiar todas las apuestas?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Limpiar',
            onPress: confirmClearBets,
          },
        ]
      );
    } else {
      confirmClearBets();
    }
  };

  return (
    <Layout style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text category="h5" style={styles.headerTitle}>
            {"Anotando " + mockDraws.find(draw => draw.id === drawId)?.source}
          </Text>
          <Button
            size="small"
            status="danger"
            onPress={handleClearBets}
            style={styles.clearButton}
          >
            Limpiar
          </Button>
        </View>
        
        <View style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Tipo de Juego
          </Text>
          <RadioGroup
            selectedIndex={safeSelectedGameTypeIndex}
            onChange={(index) => setCreateGameType(mockGameTypes[index])}
            style={styles.radioGroup}
          >
            {mockGameTypes.map((type) => (
              <Radio
                key={type.id}
                style={styles.radio}
              >
                {`${type.name} - ${type.description}`}
              </Radio>
            ))}
          </RadioGroup>
        </View>
        
        <View style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Números
          </Text>
          
          <NumberDisplay
            numbers={numbersPlayed}
            gameTypeCode={(selectedGameType?.code?.toLowerCase() as GameTypeCodes) || 'fijo'}
            annotationType="bet"
          />
          
          <CustomNumericKeyboard
            onKeyPress={handleKeyPress}
            allowWildcard={selectedGameType?.code?.toLowerCase() === 'centena'}
          />
        </View>
        
        <View style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Monto
          </Text>
          <Input
            placeholder="Ingrese monto"
            value={amount}
            onChangeText={updateCreateAmount}
            keyboardType="numeric"
            size="large"
            style={styles.amountInput}
          />
          <QuickAmountButtons
            amounts={commonAmounts}
            onSelectAmount={handleAmountSelection}
          />
          
          <Button
            onPress={handleAddBet}
            size="medium"
            status="success"
            style={styles.addBetButton}
          >
            ANOTAR MÁS+
          </Button>
        </View>
        
        <BetSummary
          draw={mockDraws.find(d => d.id === drawId) || null}
          gameType={selectedGameType}
          numbersPlayed={numbersPlayed}
          amount={parseInt(amount) || 0}
          bets={tempBets}
        />
        
        <Button
          onPress={handleSubmit}
          size="giant"
          style={styles.submitButton}
        >
          {tempBets.length > 0 ? 'REGISTRAR APUESTAS' : 'REGISTRAR APUESTA'}
        </Button>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
  },
  clearButton: {
    marginLeft: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  radioGroup: {
    marginTop: 8,
  },
  radio: {
    marginVertical: 8,
  },
  amountInput: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  addBetButton: {
    marginTop: 16,
    marginBottom: 8,
  },
});
