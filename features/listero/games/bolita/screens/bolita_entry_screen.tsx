import React from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Layout, Text, Button } from '@ui-kitten/components';
import { match } from 'ts-pattern';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';

import { ColumnHeaders } from '@/features/listero/bets/shared/components/column_headers';
import { SumRowComponent } from '@/features/listero/bets/shared/components/sum_row_component';
import FijosCorridosColumn from '@/features/listero/bets/features/fijos-corridos/components/fijos_corridos_column';
import { ParletColumn } from '@/features/listero/bets/features/parlet/components/parlet_column';
import { CentenaColumn } from '@/features/listero/bets/features/centena/components/centena_column';
import { useBetsStore, selectBetsModel, selectDispatch, selectInit } from '@/features/listero/bets/core/store';
import { ManagementMsgType } from '@/features/listero/bets/features/management/management.types';
import { CoreMsgType } from '@/features/listero/bets/core/msg';

interface BolitaEntryScreenProps {
    drawId?: string;
    title?: string;
}


const BolitaEntryScreen: React.FC<BolitaEntryScreenProps> = ({ drawId, title }) => {
    console.log('BolitaEntryScreen rendering...');
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme as keyof typeof Colors];
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);
    const init = useBetsStore(selectInit);

    const navigation = useNavigation();

    const { fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal, hasBets, isSaving } = model.summary;

    const renderSavingFooterBar = () => {
        return hasBets && (
            <Layout style={[styles.footer, { borderTopColor: themeColors.border }]} level='1'>
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
                <View style={styles.grandTotalContainer}>
                    <SumRowComponent
                        label="Total Lista"
                        total={grandTotal}
                    />
                </View>
                <View style={styles.saveButtonContainer}>
                    <Button
                        status='primary'
                        onPress={handleSave}
                        size="medium"
                        disabled={isSaving}
                        style={styles.footerButton}
                    >
                        {isSaving ? 'Guardando...' : 'Salvar'}
                    </Button>
                </View>
            </Layout>
        )
    }

    const handleSave = () => {
        if (!drawId) return;

        dispatch({
            type: 'MANAGEMENT',
            payload: { type: ManagementMsgType.SHOW_SAVE_CONFIRMATION, drawId }
        });
    };

    const renderContent = () => {
        // Always use entrySession for the entry screen
        const { fijosCorridos } = model.entrySession;

        return (
            <>
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.betContainer}>
                        <View style={styles.columnsContainer}>
                            <View style={styles.columnWrapperFijos}>
                                <FijosCorridosColumn editable={true} />
                            </View>
                            <View style={styles.columnWrapperParlet}>
                                <ParletColumn fijosCorridosList={fijosCorridos} editable={true} />
                            </View>
                            <View style={styles.columnWrapperCentena}>
                                <CentenaColumn editable={true} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
                {renderSavingFooterBar()}
            </>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
            <ColumnHeaders />
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: LayoutConstants.spacing.lg,
        paddingVertical: LayoutConstants.spacing.xs,
        paddingHorizontal: LayoutConstants.spacing.xs,
        borderBottomWidth: 1,
    },
    headerText: { textAlign: 'center' },
    scrollContainer: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    betContainer: { flexDirection: "column" },
    columnsContainer: { flexDirection: 'row', flex: 1 },
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: LayoutConstants.spacing.sm,
        paddingVertical: LayoutConstants.spacing.sm,
        backgroundColor: '#FFFFFF',
    },
    totalsRowContainer: {
        flexDirection: 'row',
        marginBottom: LayoutConstants.spacing.xs,
    },
    columnWrapperFijos: { flex: 3, borderRightWidth: 1, borderRightColor: '#E8E8E8', },
    columnWrapperParlet: { flex: 2, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
    columnWrapperCentena: { flex: 2 },
    grandTotalContainer: {
        marginTop: LayoutConstants.spacing.xs,
        borderTopWidth: 2,
        borderTopColor: '#E8E8E8',
    },
    saveButtonContainer: {
        marginTop: LayoutConstants.spacing.md,
        paddingHorizontal: LayoutConstants.spacing.sm,
    },
    footerButton: { width: '100%' },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BolitaEntryScreen;
