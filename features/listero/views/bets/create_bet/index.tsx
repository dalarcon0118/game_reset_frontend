import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Layout,
  Text,
  Select,
  SelectItem,
  IndexPath,
  Input,
  Radio,
  RadioGroup,
  Button,
  Card,
  useTheme,
} from '@ui-kitten/components';

import { DrawType as Draw, GameType, BetType } from '@/types';
import { mockDraws, mockGameTypes, commonAmounts } from '@/data/mockData';

import { isValidBetNumbers, getMaxLength } from '@/utils/betUtils';
import NumberDisplay from '../edit_list/components/NumberDisplay';
import CustomNumericKeyboard from './CustomNumericKeyboard';
import QuickAmountButtons from './QuickAmountButtons';
import BetSummary from './BetSummary';

export default function CreateBetScreen({
  drawId
}:any) {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State for form fields
  const [selectedDrawIndex, setSelectedDrawIndex] = useState<IndexPath | null>(null);
  const [selectedGameTypeIndex, setSelectedGameTypeIndex] = useState<number>(0);
  const [numbersPlayed, setNumbersPlayed] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [bets, setBets] = useState<Array<{
    gameType: GameType;
    numbers: string;
    amount: number;
  }>>([]);

  // Get selected draw and game type objects
  const selectedDraw: Draw | null = selectedDrawIndex 
    ? mockDraws[selectedDrawIndex.row] 
    : null;
  const selectedGameType: GameType = mockGameTypes[selectedGameTypeIndex];

  // Handle numeric keyboard input
  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      // Handle delete key
      setNumbersPlayed(prev => prev.slice(0, -1));
      return;
    }

    // Get max length based on game type
    const maxLength = getMaxLength(selectedGameType?.code || null);
    
    // Handle max length restriction
    if (numbersPlayed.length >= maxLength) {
      return;
    }

    // Handle wildcard 'X' (only for centena)
    if (key === 'X' && selectedGameType?.code !== 'centena') {
      return;
    }

    // Add the key to numbers played
    setNumbersPlayed(prev => prev + key);
  };

  // Handle quick amount selection
  const handleAmountSelection = (value: number) => {
    setAmount(value.toString());
  };

  // Handle adding a bet
  const handleAddBet = () => {
    // Validate fields
    if (!drawId) {
      Alert.alert('Error', 'Debe seleccionar un sorteo');
      return;
    }

    if (!isValidBetNumbers(numbersPlayed, selectedGameType?.code || null)) {
      Alert.alert('Error', 'Números inválidos para el tipo de juego seleccionado');
      return;
    }

    if (!amount || parseInt(amount) <= 0) {
      Alert.alert('Error', 'Debe ingresar un monto válido');
      return;
    }

    // Add the bet to the list
    const newBet = {
      gameType: selectedGameType,
      numbers: numbersPlayed,
      amount: parseInt(amount)
    };
    
    setBets([...bets, newBet]);
    
    // Clear the form for a new bet
    setNumbersPlayed('');
    setAmount('');
    
    // Scroll to top
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Check if there are any bets
    if (bets.length === 0) {
      // If no bets in the list, try to add the current input as a bet
      if (numbersPlayed && amount) {
        handleAddBet();
        return;
      }
      
      Alert.alert('Error', 'No hay apuestas para registrar');
      return;
    }

    // Simulate successful submission
    Alert.alert(
      'Apuestas Registradas',
      `Se han registrado ${bets.length} apuestas exitosamente`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setSelectedDrawIndex(null);
            setSelectedGameTypeIndex(0);
            setNumbersPlayed('');
            setAmount('');
            setBets([]);
          },
        },
      ]
    );
  };

  // Handle clearing all bets
  const handleClearBets = () => {
    if (bets.length > 0) {
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
            onPress: () => {
              // Reset form
              setSelectedGameTypeIndex(0);
              setNumbersPlayed('');
              setAmount('');
              setBets([]);
              
              // Scroll to top
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
              }
            },
          },
        ]
      );
    } else {
      // Just reset the form if there are no bets
      setSelectedGameTypeIndex(0);
      setNumbersPlayed('');
      setAmount('');
    }
  };

  // Render draw select items
  const renderDrawOption = (title: string) => (
    <SelectItem key={title} title={title} />
  );

  return (
    <Layout style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title and Clear Button */}
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
        
        {/* Game Type Selection */}
        <View style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Tipo de Juego
          </Text>
          <RadioGroup
            selectedIndex={selectedGameTypeIndex}
            onChange={(index) => setSelectedGameTypeIndex(index)}
            style={styles.radioGroup}
          >
            {mockGameTypes.map((type, index) => (
              <Radio
                key={type.id}
                style={styles.radio}
              >
                {`${type.name} - ${type.description}`}
              </Radio>
            ))}
          </RadioGroup>
        </View>
        
        {/* Number Input Section */}
        <View style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Números
          </Text>
          
          <NumberDisplay
            numbers={numbersPlayed}
            gameTypeCode={selectedGameType?.code || null}
          />
          
          <CustomNumericKeyboard
            onKeyPress={handleKeyPress}
            allowWildcard={selectedGameType?.code === 'centena'}
          />
        </View>
        
        {/* Amount Input Section */}
        <View style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Monto
          </Text>
          <Input
            placeholder="Ingrese monto"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            size="large"
            style={styles.amountInput}
          />
          <QuickAmountButtons
            amounts={commonAmounts}
            onSelectAmount={handleAmountSelection}
          />
          
          {/* Add Bet Button */}
          <Button
            onPress={handleAddBet}
            size="medium"
            status="success"
            style={styles.addBetButton}
          >
            ANOTAR MÁS+
          </Button>
        </View>
        
        {/* Bet Summary */}
        <BetSummary
          draw={drawId}
          gameType={selectedGameType}
          numbersPlayed={numbersPlayed}
          amount={parseInt(amount) || 0}
          bets={bets}
        />
        
        {/* Submit Button */}
        <Button
          onPress={handleSubmit}
          size="giant"
          style={styles.submitButton}
        >
          REGISTRAR APUESTA{bets.length > 0 ? 'S' : ''}
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