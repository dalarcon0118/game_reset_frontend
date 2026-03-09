import React, { useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Layout from '@/constants/layout';
import { useLoteria } from '../../use_loteria';
import { BetDrawerKeyboard } from '@/shared/components/bets/bet_drawer_keyboard';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';

// Sub-components (SRP)
import { LoteriaJackpotBanner } from './loteria_jackpot_banner';
import { LoteriaHeader } from './loteria_header';
import { LoteriaTotalRow } from './loteria_total_row';
import { LoteriaGroupList } from './loteria_group_list';
import { LoteriaAddBetButton } from './loteria_add_bet_button';

// Logic & Types
import { groupBetsByReceipt } from './loteria_column.impl';

export interface LoteriaColumnProps {
    isEditing?: boolean;
    onViewReceipt?: (receiptCode: string) => void;
}

/**
 * 🎰 LoteriaColumn Component
 * 
 * Orchestrates the UI for the Loteria betting module.
 * Optimized for cognitive load and performance using SRP and TEA principles.
 */
export const LoteriaColumn: React.FC<LoteriaColumnProps> = memo(({ 
    isEditing = true,
    onViewReceipt
}) => {
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

    // Data Transformation (Memoized)
    const groupedBets = useMemo(() => 
        groupBetsByReceipt(loteriaList, isEditing), 
        [loteriaList, isEditing]
    );

    return (
        <View style={styles.container}>
            {/* 🎯 Jackpot Information */}
            <LoteriaJackpotBanner 
                jackpotAmount={drawDetails?.extra_data?.jackpot_amount}
                currency={drawDetails?.extra_data?.currency}
            />

            {/* 📋 Header Section */}
            <LoteriaHeader 
                hasFixedAmount={hasFixedAmount}
                fixedAmount={fixedAmount}
            />
            
            {/* 📜 Betting List Content */}
            <View style={styles.listContent}>
                <LoteriaGroupList 
                    groups={groupedBets}
                    isEditing={isEditing}
                    hasFixedAmount={hasFixedAmount}
                    onEditBet={editLoteriaBet}
                    onOpenAmountKeyboard={openAmountKeyboard}
                    onViewReceipt={onViewReceipt}
                />
                
                {/* ➕ Add New Bet Action */}
                <LoteriaAddBetButton 
                    isVisible={isEditing}
                    hasFixedAmount={hasFixedAmount}
                    onPress={openBetKeyboard}
                />

                {/* 💰 Totals Summary */}
                <LoteriaTotalRow totalAmount={loteriaTotal} />
            </View>

            {/* ⌨️ Interactive Keyboard (TEA Managed) */}
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
});

LoteriaColumn.displayName = 'LoteriaColumn';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Layout.spacing.md,
    },
    listContent: {
        paddingVertical: Layout.spacing.xs,
    },
});
