import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { LoteriaBetRow } from './loteria_bet_row';
import { LoteriaGroup } from './loteria_column.types';
import { LoteriaBet } from '@/types';

interface LoteriaGroupListProps {
    groups: LoteriaGroup[];
    isEditing: boolean;
    hasFixedAmount: boolean;
    onEditBet: (id: string) => void;
    onOpenAmountKeyboard: (id: string) => void;
    onViewReceipt?: (receiptCode: string) => void;
}

export const LoteriaGroupList: React.FC<LoteriaGroupListProps> = memo(({
    groups,
    isEditing,
    hasFixedAmount,
    onEditBet,
    onOpenAmountKeyboard,
    onViewReceipt
}) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;

    return (
        <View style={styles.listContent}>
            {groups.map((group, groupIndex) => (
                <RenderGroup 
                    key={`${group.receiptCode}-${groupIndex}`}
                    group={group}
                    isEditing={isEditing}
                    hasFixedAmount={hasFixedAmount}
                    colorScheme={colorScheme}
                    onEditBet={onEditBet}
                    onOpenAmountKeyboard={onOpenAmountKeyboard}
                    onViewReceipt={onViewReceipt}
                    isLast={groupIndex === groups.length - 1}
                />
            ))}
        </View>
    );
});

LoteriaGroupList.displayName = 'LoteriaGroupList';

interface RenderGroupProps {
    group: LoteriaGroup;
    isEditing: boolean;
    hasFixedAmount: boolean;
    colorScheme: keyof typeof Colors;
    onEditBet: (id: string) => void;
    onOpenAmountKeyboard: (id: string) => void;
    onViewReceipt?: (code: string) => void;
    isLast: boolean;
}

const RenderGroup: React.FC<RenderGroupProps> = memo(({ 
    group, 
    isEditing, 
    hasFixedAmount, 
    colorScheme, 
    onEditBet, 
    onOpenAmountKeyboard, 
    onViewReceipt,
    isLast
}) => {
    const handleViewReceipt = useCallback(() => {
        if (onViewReceipt && group.receiptCode !== '-----') {
            onViewReceipt(group.receiptCode);
        }
    }, [onViewReceipt, group.receiptCode]);

    return (
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
            {!isEditing && group.receiptCode !== '-----' && onViewReceipt && (
                <TouchableOpacity
                    style={[styles.receiptButton, { backgroundColor: Colors[colorScheme].primary }]}
                    onPress={handleViewReceipt}
                >
                    <Text style={styles.receiptButtonText}>Ver comprobante</Text>
                </TouchableOpacity>
            )}

            {!isEditing && !isLast && (
                <View style={styles.groupSeparator} />
            )}
        </View>
    );
});

RenderGroup.displayName = 'RenderGroup';

const styles = StyleSheet.create({
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
});
