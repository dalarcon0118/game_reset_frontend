import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from '@ui-kitten/components';

export const ErrorBetsView = ({ onRetry, goToHome }: { onRetry: () => void; goToHome?: () => void }) => (
    <View style={styles.centerContainer}>
        <Text category='s1' style={styles.messageText}>Error al cargar las apuestas. Verifique su conexión e intente nuevamente.</Text>
        <Button onPress={onRetry} style={styles.button}>
            Reintentar
        </Button>
        {goToHome && (
            <Button appearance='ghost' onPress={goToHome} style={styles.secondaryButton}>
                Ir al inicio
            </Button>
        )}
    </View>
);

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    messageText: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#8F9BB3',
    },
    button: {
        marginTop: 10,
    },
    secondaryButton: {
        marginTop: 16,
    }
});