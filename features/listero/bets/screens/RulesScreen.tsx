import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RulesList } from '../features/rules';

interface RulesScreenProps {
    drawId?: string;
}

export const RulesScreen: React.FC<RulesScreenProps> = ({ drawId }) => {
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <RulesList drawId={drawId} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
});

export default RulesScreen;
