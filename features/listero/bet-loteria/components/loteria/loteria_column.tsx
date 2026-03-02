import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Layout from '@/constants/layout';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useLoteria } from '../../use_loteria';
import { BetDrawerKeyboard } from '@/shared/components/bets/bet_drawer_keyboard';

// Sub-components (SRP)
import { LoteriaJackpotBanner } from './loteria_jackpot_banner';
import { LoteriaHeader } from './loteria_header';
import { LoteriaBetRow } from './loteria_bet_row';
import { LoteriaTotalRow } from './loteria_total_row';
import { LoteriaBet } from '@/types';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';
import BetCircle from '@/shared/components/bets/bet_circle';

// Logic & Types
import { groupBetsByReceipt } from './loteria_column.impl';
import { LoteriaGroup } from './loteria_column.types';

export interface LoteriaColumnProps {
    isEditing?: boolean;
}

/**
 * Componente principal de la columna de Lotería.
 * Refactorizado como Vista Pura (Stateless-ish) siguiendo TEA y las Tres Rejillas.
 */
export const LoteriaColumn: React.FC<LoteriaColumnProps> = ({ isEditing = true }) => {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;

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
        loteriaTotal,
    } = useLoteria();

    const hasFixedAmount = fixedAmount !== null && fixedAmount > 0;

    // DEBUG: Log loteriaList received
    console.log('[LoteriaColumn DEBUG]:', {
        loteriaListLength: loteriaList?.length || 0,
        loteriaListFirst: loteriaList?.[0],
        isEditing,
        loteriaTotal
    });

    // Agrupar apuestas usando la lógica pura extraída
    const groupedBets = useMemo(() => 
        groupBetsByReceipt(loteriaList, isEditing), 
        [loteriaList, isEditing]
    );

    const handleViewReceipt = useCallback((receiptCode: string) => {
        if (!receiptCode || receiptCode === '-----') return;

        router.push({
            pathname: '/lister/bet_success',
            params: {
                receiptCode,
                drawId: drawDetails?.id
            }
        });
    }, [router, drawDetails]);

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
                {groupedBets.map((group: LoteriaGroup, groupIndex: number) => (
                    <RenderGroup 
                        key={`${group.receiptCode}-${groupIndex}`}
                        group={group}
                        isEditing={isEditing}
                        hasFixedAmount={hasFixedAmount}
                        colorScheme={colorScheme}
                        onEditBet={editLoteriaBet}
                        onOpenAmountKeyboard={openAmountKeyboard}
                        onViewReceipt={handleViewReceipt}
                        isLast={groupIndex === groupedBets.length - 1}
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

/**
 * Sub-componente interno para renderizar un grupo de apuestas.
 * Mejora la legibilidad y reduce la carga cognitiva.
 */
interface RenderGroupProps {
    group: LoteriaGroup;
    isEditing: boolean;
    hasFixedAmount: boolean;
    colorScheme: keyof typeof Colors;
    onEditBet: (id: string, field: string, value: any) => void;
    onOpenAmountKeyboard: (id: string) => void;
    onViewReceipt: (code: string) => void;
    isLast: boolean;
}

const RenderGroup: React.FC<RenderGroupProps> = ({ 
    group, 
    isEditing, 
    hasFixedAmount, 
    colorScheme, 
    onEditBet, 
    onOpenAmountKeyboard, 
    onViewReceipt,
    isLast
}) => (
    <View style={styles.groupContainer}>
        {!isEditing && group.receiptCode !== '-----' && (
            <View style={styles.groupHeader}>
                <Text style={styles.groupHeaderText}>Recibo: {group.receiptCode}</Text>
            </View>
        )}

        {group.items.map((item: LoteriaBet) => (
            <LoteriaBetRow
                key={item.id}
                item={item}
                isEditing={isEditing}
                hasFixedAmount={hasFixedAmount}
                onEditBet={onEditBet}
                onOpenAmountKeyboard={onOpenAmountKeyboard}
            />
        ))}

        {/* Botón para ver comprobante */}
        {!isEditing && group.receiptCode !== '-----' && (
            <TouchableOpacity
                style={[styles.receiptButton, { backgroundColor: Colors[colorScheme].primary }]}
                onPress={() => onViewReceipt(group.receiptCode)}
            >
                <Text style={styles.receiptButtonText}>Ver comprobante</Text>
            </TouchableOpacity>
        )}

        {!isEditing && !isLast && (
            <View style={styles.groupSeparator} />
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Layout.spacing.md,
    },
    listContent: {
        paddingVertical: Layout.spacing.xs,
    },
    groupContainer: {
        marginBottom: Layout.spacing.md,
    },
    groupHeader: {
        backgroundColor: '#f8f8f8',
        padding: 8,
        marginBottom: 8,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#3366FF',
    },
    groupHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    groupSeparator: {
        height: 1,
        backgroundColor: '#E8E8E8',
        marginVertical: 16,
    },
    receiptButton: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    receiptButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
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
