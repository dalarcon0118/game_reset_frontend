import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout } from '@ui-kitten/components';
import { Stack } from 'expo-router';
import { RulesList } from '../components/rules_list';
import Colors from '@/constants/colors';

interface RulesScreenProps {
    drawId?: string;
}

export const RulesScreen: React.FC<RulesScreenProps> = ({ drawId }) => {
    return (
        <Layout style={styles.container} level='1'>
            <Stack.Screen options={{ title: 'Reglas y Premios' }} />
            <RulesList drawId={drawId} />
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default RulesScreen;
