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
                <Text category='c1' style={styles.receiptLabel}>CÓDIGO DE RECIBO</Text>
                <View style={styles.codeWrapper}>
                    <Text category='h1' style={styles.receiptCode}>{receiptCode}</Text>
                </View>
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
        backgroundColor: '#F7F9FC',
        padding: 20,
        borderRadius: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E4E9F2',
    },
    receiptLabel: {
        color: '#8F9BB3',
        letterSpacing: 2,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    codeWrapper: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EDF1F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    receiptCode: {
        letterSpacing: 6,
        fontWeight: '900',
        color: '#222B45',
    },
});
