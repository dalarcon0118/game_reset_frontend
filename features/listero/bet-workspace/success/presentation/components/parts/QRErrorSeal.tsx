import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';

interface QRErrorSealProps {
    metadata?: { fingerprintHash?: string; auditUrl?: string };
}

export const QRErrorSeal: React.FC<QRErrorSealProps> = ({ metadata: _metadata }) => {
    return (
        <View style={styles.container} collapsable={false}>
            <View style={styles.iconContainer} collapsable={false}>
                <Text style={styles.icon}>⚠️</Text>
            </View>
            <Text category='c1' style={styles.title}>SELLO NO DISPONIBLE</Text>
            <Text category='c2' style={styles.message}>
                No se pudo generar el código QR de seguridad. El identificador único (fingerprint) no está disponible para esta apuesta.
            </Text>
            <Text category='c2' style={styles.hint}>
                Esto puede ocurrir con apuestas creadas offline sin conexión o en versiones anteriores del sistema.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 15,
        padding: 20,
        backgroundColor: '#FFF5F5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFEBEE',
        borderStyle: 'solid',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 24,
    },
    title: {
        fontWeight: 'bold',
        color: '#D32F2F',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    message: {
        color: '#5F6368',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 8,
    },
    hint: {
        color: '#9E9E9E',
        textAlign: 'center',
        fontSize: 11,
        fontStyle: 'italic',
        lineHeight: 16,
    },
});