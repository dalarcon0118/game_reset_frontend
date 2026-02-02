import React, { useRef } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Input, Radio, RadioGroup, Button } from '@ui-kitten/components';
import { SafeAreaView } from 'react-native-safe-area-context';
import { match } from 'ts-pattern';

import { commonAmounts } from '@/data/mock_data';
import { GameTypeCodes } from '@/constants/bet';


import { BetSummary } from '../features/create-bet/components/bet_summary';
import { useCreate } from '../features/create-bet/use_create';
import { NumberDisplay } from '@/shared/components/number_display';
import { CustomNumericKeyboard } from '../features/create-bet/components/custom_numeric_keyboard';
import { QuickAmountButtons } from '../features/create-bet/components/quick_amount_buttons';

interface CreateBetScreenProps {
    drawId: string;
}

export const CreateBetScreen: React.FC<CreateBetScreenProps> = ({ drawId }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    
    const {
        draw,
        gameTypes,
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

    return match({ draw, gameTypes })
        .with({ draw: { type: 'Loading' } }, () => (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text category="s1">Cargando sorteo...</Text>
            </View>
        ))
        .with({ draw: { type: 'Failure' } }, ({ draw }) => (
            <View style={styles.centered}>
                <Text status="danger" style={styles.errorText}>Error: {draw.error}</Text>
                <Button 
                    onPress={() => handleKeyPress('RETRY')} 
                    status="primary"
                    style={styles.retryButton}
                >
                    Reintentar
                </Button>
            </View>
        ))
        .with({ draw: { type: 'Success' }, gameTypes: { type: 'Success' } }, ({ draw, gameTypes }) => {
            const availableGameTypes = gameTypes.data;
            const selectedGameTypeIndex = availableGameTypes.findIndex(t => t.id === selectedGameType?.id);
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
                                {"Anotando " + (draw.data.source || draw.data.name)}
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
                                onChange={(index) => setGameType(availableGameTypes[index])}
                                style={styles.radioGroup}
                            >
                                {availableGameTypes.map((type) => (
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
                            draw={draw.data}
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
        })
        .otherwise(() => (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text category="s1">Inicializando...</Text>
            </View>
        ));
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { marginBottom: 16, textAlign: 'center' },
    retryButton: { minWidth: 150 },
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
