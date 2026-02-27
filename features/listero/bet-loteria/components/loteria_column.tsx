import React from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import { useLoteria } from '../use_loteria';
import { BetDrawerKeyboard } from '@/shared/components/bets/bet_drawer_keyboard';

// Sub-components (SRP)
import { LoteriaJackpotBanner } from './loteria/loteria_jackpot_banner';
import { LoteriaHeader } from './loteria/loteria_header';
import { LoteriaBetRow } from './loteria/loteria_bet_row';
import { LoteriaTotalRow } from './loteria/loteria_total_row';
import { LoteriaBet } from '@/types';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';
import BetCircle from '@/shared/components/bets/bet_circle';

export interface LoteriaColumnProps {
    isEditing?: boolean;
}

/**
 * Componente principal de la columna de Lotería.
 * Refactorizado para seguir un flujo declarativo y SRP.
 */
export const LoteriaColumn: React.FC<LoteriaColumnProps> = ({ isEditing = true }) => {
    const {
        loteriaList,
        fixedAmount,
        isBetKeyboardVisible,
        isAmountKeyboardVisible,
        currentInput,
        openBetKeyboard,
        closeBetKeyboard,
        openAmountKeyboard,
        closeAmountKeyboard,
        editLoteriaBet,
        drawDetails,
        handleKeyPress,
        handleConfirmInput,
        loteriaTotal, // Usamos el total del hook (Single Source of Truth)
    } = useLoteria();

    const hasFixedAmount = fixedAmount !== null && fixedAmount > 0;

    return (
        <View style={styles.container}>
            {/* 1. Información de Premio Mayor */}
            <LoteriaJackpotBanner 
                jackpotAmount={drawDetails?.extra_data?.jackpot_amount}
                currency={drawDetails?.extra_data?.currency}
            />

            {/* 2. Cabecera de la lista */}
            <LoteriaHeader 
                hasFixedAmount={hasFixedAmount}
                fixedAmount={fixedAmount}
            />
            
            {/* 3. Lista de jugadas */}
            <View style={styles.listContent}>
                {loteriaList.map((item: LoteriaBet) => (
                    <LoteriaBetRow
                        key={item.id}
                        item={item}
                        isEditing={isEditing}
                        hasFixedAmount={hasFixedAmount}
                        onEditBet={editLoteriaBet}
                        onOpenAmountKeyboard={openAmountKeyboard}
                    />
                ))}
                
                {/* Botón para agregar nueva jugada */}
                <View style={[styles.betRow, hasFixedAmount && styles.betRowCentered]}>
                    {isEditing && (
                        <BetCircle 
                            value={"+"} 
                            onPress={openBetKeyboard} 
                        />
                    )}
                </View>

                {/* 4. Resumen de totales */}
                <LoteriaTotalRow totalAmount={loteriaTotal} />
            </View>

            {/* 5. Teclado interactivo - Solo se muestra si estamos en modo edición */}
            {isEditing && (
                <BetDrawerKeyboard
                    isVisible={isBetKeyboardVisible || isAmountKeyboardVisible}
                    onClose={isBetKeyboardVisible ? closeBetKeyboard : closeAmountKeyboard}
                    showBetKeyboard={isBetKeyboardVisible}
                    currentInput={currentInput}
                    onKeyPress={handleKeyPress}
                    onConfirm={handleConfirmInput}
                    betType={BET_TYPE_KEYS.LOTERIA}
                    betFormat="X-XX-XX"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Layout.spacing.md,
    },
    listContent: {
        paddingVertical: Layout.spacing.xs,
    },
    betRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.lg,
    },
    betRowCentered: {
        justifyContent: 'center',
    },
});
