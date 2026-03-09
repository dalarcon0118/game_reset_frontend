import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Layout, Button } from '@ui-kitten/components';
import { SumRowComponent } from '@/shared/components/bets/sum_row_component';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { BolitaModel } from '../../domain/models/bolita.types';

interface BolitaSavingFooterProps {
    summary: BolitaModel['summary'];
    onSave: () => void;
}

export const BolitaSavingFooter: React.FC<BolitaSavingFooterProps> = ({ summary, onSave }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme as keyof typeof Colors];

    const { 
        fijosCorridosTotal, 
        parletsTotal, 
        centenasTotal, 
        grandTotal, 
        hasBets, 
        isSaving 
    } = summary;

    if (!hasBets) return null;

    return (
        <Layout style={[styles.footer, { borderTopColor: themeColors.border, backgroundColor: themeColors.background }]} level='1'>
            <View style={styles.totalsRowContainer}>
                <View style={styles.columnWrapperFijos}>
                    <SumRowComponent
                        label="F/C"
                        total={fijosCorridosTotal}
                    />
                </View>
                <View style={styles.columnWrapperParlet}>
                    <SumRowComponent
                        label="P"
                        total={parletsTotal}
                    />
                </View>
                <View style={styles.columnWrapperCentena}>
                    <SumRowComponent
                        label="C"
                        total={centenasTotal}
                    />
                </View>
            </View>
            <View style={[styles.grandTotalContainer, { borderTopColor: themeColors.border }]}>
                <SumRowComponent
                    label="Total Lista"
                    total={grandTotal}
                />
            </View>
            <View style={styles.saveButtonContainer}>
                <Button
                    status='primary'
                    onPress={onSave}
                    size="medium"
                    disabled={isSaving}
                    style={styles.footerButton}
                >
                    {isSaving ? 'Guardando...' : 'Salvar'}
                </Button>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: LayoutConstants.spacing.sm,
        paddingVertical: LayoutConstants.spacing.sm,
    },
    totalsRowContainer: {
        flexDirection: 'row',
        marginBottom: LayoutConstants.spacing.xs,
    },
    columnWrapperFijos: { 
        flex: 3, 
        borderRightWidth: 1, 
        borderRightColor: '#E8E8E8', // Se mantendrá para consistencia visual de separadores, o puede usarse themeColors.border
    },
    columnWrapperParlet: { 
        flex: 2, 
        borderRightWidth: 1, 
        borderRightColor: '#E8E8E8' 
    },
    columnWrapperCentena: { 
        flex: 2 
    },
    grandTotalContainer: {
        marginTop: LayoutConstants.spacing.xs,
        borderTopWidth: 2,
    },
    saveButtonContainer: {
        marginTop: LayoutConstants.spacing.md,
        paddingHorizontal: LayoutConstants.spacing.sm,
    },
    footerButton: { 
        width: '100%' 
    },
});
