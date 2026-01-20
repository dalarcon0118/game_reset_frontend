import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { CheckCircle2 } from 'lucide-react-native';

interface SuccessHeaderProps {
    receiptCode: string;
}

export const SuccessHeader: React.FC<SuccessHeaderProps> = ({ receiptCode }) => {
    const theme = useTheme();

    return (
        <View style={styles.header}>
            <View style={styles.iconContainer}>
                <CheckCircle2
                    size={64}
                    color={theme['color-success-500']}
                />
            </View>
            <Text category='h4' style={styles.title}>Apuesta creada correctamente</Text>
            <View style={styles.receiptContainer}>
                <Text appearance='hint'>Código de Recibo</Text>
                <Text category='h2' style={styles.receiptCode}>{receiptCode}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginVertical: 30,
        width: '100%',
    },
    iconContainer: {
        marginBottom: 15,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    receiptContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 15,
        borderRadius: 12,
        width: '100%',
    },
    receiptCode: {
        letterSpacing: 4,
        fontWeight: 'bold',
        marginTop: 5,
    },
});
