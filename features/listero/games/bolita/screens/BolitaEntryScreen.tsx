import React from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, Text, Button } from '@ui-kitten/components';
import { match } from 'ts-pattern';
import Colors from '@/constants/Colors';
import LayoutConstants from '@/constants/Layout';

import { ColumnHeaders } from '@/features/listero/bets/shared/components/ColumnHeaders';
import { SumRowComponent } from '@/features/listero/bets/shared/components/SumRowComponent';
import FijosCorridosColumn from '@/features/listero/bets/features/fijos-corridos/components/FijosCorridosColumn';
import { ParletColumn } from '@/features/listero/bets/features/parlet/components/ParletColumn';
import { CentenaColumn } from '@/features/listero/bets/features/centena/components/CentenaColumn';
import { useBetsStore, selectBetsModel, selectDispatch, selectInit } from '@/features/listero/bets/core/store';
import { ManagementMsgType } from '@/features/listero/bets/features/management/management.types';

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

    // Ya no inicializamos aquí, lo hace EditListScreen
    /*
    useFocusEffect(
        React.useCallback(() => {
            if (drawId) {
                // Clear previous state first
                dispatch({
                    type: 'MANAGEMENT',
                    payload: { type: ManagementMsgType.RESET_BETS }
                });
                // Initialize for the current draw
                init({ drawId, fetchExistingBets: false });
            }
        }, [drawId, init, dispatch])
    );
    */

    const isSaving = model.managementSession.saveStatus.type === 'Loading';

    const renderSavingFooterBar = ({ fijosCorridos, parlets, centenas, handleSave, isSaving, themeColors, fijosCorridosTotal, parletsTotal, centenasTotal, grandTotal }: { fijosCorridos: any[], parlets: any[], centenas: any[], handleSave: () => void, isSaving: boolean, themeColors: any, fijosCorridosTotal: number, parletsTotal: number, centenasTotal: number, grandTotal: number }) => {
        return (fijosCorridos.length > 0 || parlets.length > 0 || centenas.length > 0) && (
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



    const hasBets = React.useMemo(() => {
        // Si ya se guardó con éxito, no consideramos que haya apuestas pendientes por guardar
        if (model.managementSession.saveSuccess) {
            return false;
        }

        const { fijosCorridos, parlets, centenas } = model.listSession.remoteData.type === 'Success'
            ? model.listSession.remoteData.data
            : { fijosCorridos: [], parlets: [], centenas: [] };
        return fijosCorridos.length > 0 || parlets.length > 0 || centenas.length > 0;
    }, [model.listSession.remoteData, model.managementSession.saveSuccess]);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!hasBets) {
                return;
            }

            e.preventDefault();

            dispatch({
                type: 'MANAGEMENT',
                payload: {
                    type: ManagementMsgType.NAVIGATE_REQUESTED,
                    onConfirm: () => navigation.dispatch(e.data.action)
                }
            });
        });

        return unsubscribe;
    }, [navigation, hasBets]);

    const handleSave = () => {
        if (!drawId) return;

        dispatch({
            type: 'MANAGEMENT',
            payload: { type: ManagementMsgType.SHOW_SAVE_CONFIRMATION, drawId }
        });
    };

    const renderContent = () => {
        return match(model.listSession.remoteData)
            .with({ type: 'NotAsked' }, () => null)
            .with({ type: 'Loading' }, () => (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                </View>
            ))
            .with({ type: 'Failure' }, ({ error }) => (
                <View style={styles.centerContainer}>
                    <Text status="danger">Error: {error}</Text>
                </View>
            ))
            .with({ type: 'Success' }, ({ data }) => {
                const { fijosCorridos, parlets, centenas } = data;

                const fijosCorridosTotal = fijosCorridos.reduce((total, bet) => {
                    const fijoAmount = bet.fijoAmount || 0;
                    const corridoAmount = bet.corridoAmount || 0;
                    return total + fijoAmount + corridoAmount;
                }, 0);

                const parletsTotal = parlets.reduce((total, parlet) => {
                    if (parlet.bets && parlet.bets.length > 0 && parlet.amount) {
                        const numBets = parlet.bets.length;
                        const parletTotal = numBets * (numBets - 1) * parlet.amount;
                        return total + parletTotal;
                    }
                    return total;
                }, 0);

                const centenasTotal = centenas.reduce((total, centena) => {
                    return total + (centena.amount || 0);
                }, 0);

                const grandTotal = fijosCorridosTotal + parletsTotal + centenasTotal;

                console.log('BolitaEntryScreen: Rendering Success state with data:', {
                    fijosCorridos: fijosCorridos.length,
                    parlets: parlets.length,
                    centenas: centenas.length
                });

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
                        {renderSavingFooterBar({
                            fijosCorridos,
                            parlets,
                            centenas,
                            handleSave,
                            isSaving,
                            themeColors,
                            fijosCorridosTotal,
                            parletsTotal,
                            centenasTotal,
                            grandTotal
                        })}
                    </>
                );
            })
            .exhaustive();
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
