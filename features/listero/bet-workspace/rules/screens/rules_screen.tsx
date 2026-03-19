import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout } from '@ui-kitten/components';
import { Stack } from 'expo-router';
import { RulesList } from '../components/rules_list';
import { BetWorkspaceProvider } from '../../core/store';
import Colors from '@/constants/colors';

interface RulesScreenProps {
    drawId?: string;
}

export const RulesScreen: React.FC<RulesScreenProps> = ({ drawId }) => {
    return (
        <BetWorkspaceProvider initialParams={{ drawId: drawId as string, mode: 'list' }}>
            <Layout style={styles.container} level='1'>
                <Stack.Screen options={{ title: 'Reglas y Premios' }} />
                <RulesList drawId={drawId} />
            </Layout>
        </BetWorkspaceProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default RulesScreen;
