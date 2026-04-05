import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';

interface LoteriaInfoBoxProps {
    metadata?: { disclaimer?: string };
}

export const LoteriaInfoBox: React.FC<LoteriaInfoBoxProps> = ({ metadata: _metadata }) => {
    return (
        <View style={styles.box} collapsable={false}>
            <Text category='c1' style={styles.text}>
                * En caso de múltiples ganadores con el mismo número premiados, el premio mayor se dividirá en partes iguales entre todos los ganadores.
            </Text>
            <Text category='c1' style={styles.link}>
                Consulta ganadores en: game-reset.com
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    box: {
        backgroundColor: '#F7F9FC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#3366FF',
    },
    text: {
        color: '#222B45',
        fontSize: 11,
        lineHeight: 16,
        fontStyle: 'italic',
    },
    link: {
        color: '#3366FF',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 6,
    },
});