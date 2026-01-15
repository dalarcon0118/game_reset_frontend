import React, { useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Input, Radio, RadioGroup, Button } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mockDraws, mockGameTypes, commonAmounts } from '@/data/mockData';
import { GameTypeCodes } from '@/constants/Bet';


import { BetSummary } from '../features/create-bet/components/BetSummary';
import { useCreate } from '../features/create-bet/useCreate';
import { NumberDisplay } from '@/shared/components/number_display';
import { CustomNumericKeyboard } from '../features/create-bet/components/CustomNumericKeyboard';
import { QuickAmountButtons } from '../features/create-bet/components/QuickAmountButtons';

interface CreateBetScreenProps {
    drawId: string;
}

export const CreateBetScreen: React.FC<CreateBetScreenProps> = ({ drawId }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    
    const {
        selectedGameType,
        numbersPlayed,
        amount,
        playerAlias,
        tempBets,
        setGameType,
        handleKeyPress,
        handleAmountSelection,
        updatePlayerAlias,
        validateAndAddBet,
        submitSession,
        confirmClearBets,
    } = useCreate(drawId);

    // Selected game type index for RadioGroup
    const selectedGameTypeIndex = mockGameTypes.findIndex(t => t.id === selectedGameType?.id);
    const safeSelectedGameTypeIndex = selectedGameTypeIndex === -1 ? 0 : selectedGameTypeIndex;

    const handleAddBet = () => {
        validateAndAddBet();
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
    };

    const handleSubmit = () => {
        submitSession();
    };

    return (
        <SafeAreaView style={styles.container}>
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
                        onPress={confirmClearBets}
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
                        onChange={(index) => setGameType(mockGameTypes[index])}
                        style={styles.radioGroup}
                    >
                        {mockGameTypes.map((type) => (
                            <Radio key={type.id} style={styles.radio}>
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
                        Alias del Jugador (Opcional)
                    </Text>
                    <Input
                        placeholder="Ej: Juan el Mecánico"
                        value={playerAlias}
                        onChangeText={updatePlayerAlias}
                        size="large"
                        style={styles.aliasInput}
                    />
                </View>
                
                <View style={styles.section}>
                    <Text category="s1" style={styles.sectionTitle}>
                        Monto
                    </Text>
                    <Input
                        placeholder="Ingrese monto"
                        value={amount}
                        onChangeText={(val) => handleAmountSelection(parseInt(val) || 0)}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollViewContent: { paddingHorizontal: 16, paddingBottom: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerTitle: { flex: 1 },
    clearButton: { marginLeft: 10 },
    section: { marginBottom: 24 },
    sectionTitle: { marginBottom: 8 },
    radioGroup: { marginTop: 8 },
    radio: { marginVertical: 8 },
    aliasInput: { marginBottom: 8 },
    amountInput: { marginBottom: 8 },
    submitButton: { marginTop: 24, marginBottom: 16 },
    addBetButton: { marginTop: 16, marginBottom: 8 },
});
