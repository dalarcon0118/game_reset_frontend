import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, Text, Button } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/native';
import Colors from '@/constants/colors';
import LayoutConstants from '@/constants/layout';
import { LoteriaColumn } from '../components/loteria_column';
import { useBetsStore, selectBetsModel, selectDispatch } from '@/features/listero/bets/core/store';
import { ManagementMsgType } from '@/features/listero/bets/features/management/management.types';
import { CoreMsgType } from '@/features/listero/bets/core/msg';
import { SumRowComponent } from '@/features/listero/bets/shared/components/sum_row_component';

interface LoteriaEntryScreenProps {
    drawId?: string;
    title?: string;
}

const LoteriaEntryScreen: React.FC<LoteriaEntryScreenProps> = ({ drawId, title }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme as keyof typeof Colors];
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { loteriaTotal, hasBets, isSaving } = model.summary;

    const handleSave = () => {
        if (!drawId) return;

        dispatch({
            type: 'MANAGEMENT',
            payload: { type: ManagementMsgType.SHOW_SAVE_CONFIRMATION, drawId }
        });
    };

    const renderSavingFooterBar = () => {
        if (!hasBets) return null;
        return (
            <Layout style={[styles.footer, { borderTopColor: themeColors.border }]} level='1'>
                <View style={styles.grandTotalContainer}>
                    <SumRowComponent
                        label="Total Lista"
                        total={loteriaTotal}
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
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
            <View style={styles.content}>
                <LoteriaColumn isEditing={model.isEditing} />
            </View>
            {renderSavingFooterBar()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    headerText: { textAlign: 'center' },
    content: {
        flex: 1,
        paddingTop: 16,
    },
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: LayoutConstants.spacing.sm,
        paddingVertical: LayoutConstants.spacing.sm,
        backgroundColor: '#FFFFFF',
    },
    grandTotalContainer: {
        marginBottom: LayoutConstants.spacing.xs,
        borderTopWidth: 2,
        borderTopColor: '#E8E8E8',
        paddingTop: LayoutConstants.spacing.xs,
    },
    saveButtonContainer: {
        marginTop: LayoutConstants.spacing.md,
        paddingHorizontal: LayoutConstants.spacing.sm,
    },
    footerButton: { width: '100%' },
});

export default LoteriaEntryScreen;
