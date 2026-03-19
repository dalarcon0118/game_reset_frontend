import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import Colors from '@/constants/colors';

import { ColumnHeaders } from '@/shared/components/bets/column_headers';
import { BolitaSavingFooter } from '../components/BolitaSavingFooter';
import { BolitaEntryColumns } from '../components/BolitaEntryColumns';
import { BolitaKeyboardManager } from '../components/bolita_keyboard_manager';
import { useBolitaDispatch, useBolitaModel, BolitaStoreProvider } from '../store';
import { REQUEST_SAVE_ALL_BETS, SET_USER_CONTEXT } from '../../domain/models/bolita.messages';
import { useAuth } from '@/features/auth';

import { logger } from '@/shared/utils/logger';

interface BolitaEntryScreenProps {
    drawId?: string;
    title?: string;
    betType?: string;
}

const log = logger.withTag('BOLITA_ENTRY_SCREEN');

const BolitaEntryScreenContent: React.FC<BolitaEntryScreenProps> = ({ drawId, betType }) => {
    log.debug('BolitaEntryScreen rendering...', { drawId, betType });
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme as keyof typeof Colors];
    const model = useBolitaModel();
    const dispatch = useBolitaDispatch();
    const { user } = useAuth();

    useEffect(() => {
        log.debug('BolitaEntryScreen useEffect triggered with user:', user);

        if (user?.structure?.id) {
            log.debug('Setting user context structureId:', user.structure.id);
            dispatch(SET_USER_CONTEXT({ structureId: Number(user.structure.id) }));
        }
    }, [user?.structure?.id, user, dispatch]);

    const handleSave = () => {
        if (!drawId) return;
        dispatch(REQUEST_SAVE_ALL_BETS({ drawId }));
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <ColumnHeaders />
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
            >
                <BolitaEntryColumns entrySession={model.entrySession} />
            </ScrollView>
            
            <BolitaSavingFooter 
                summary={model.summary} 
                onSave={handleSave} 
            />
            
            <BolitaKeyboardManager />
        </View>
    );
};

const BolitaEntryScreen: React.FC<BolitaEntryScreenProps> = (props) => {
    return (
        <BolitaStoreProvider initialParams={{ drawId: props.drawId, betType: props.betType }}>
            <BolitaEntryScreenContent {...props} />
        </BolitaStoreProvider>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { flex: 1 },
    scrollContent: { flexGrow: 1 },
});

export default BolitaEntryScreen;
