import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, Layout } from '@ui-kitten/components';
import { Flex } from '@/shared/components';
import { useAuthV1 } from '../../hooks/use_auth';
import { RESET_AUTH_STATE } from '@/shared/auth/v1/msg';

interface ConnectionErrorViewProps {
    error?: string | null;
}

export const ConnectionErrorView: React.FC<ConnectionErrorViewProps> = ({ error }) => {
    const { dispatch } = useAuthV1();

    return (
        <Layout style={styles.container}>
            <Flex vertical align="center" justify="center" gap={24} padding="xl" style={{ flex: 1 }}>
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 60 }}>📡❌</Text>
                </View>

                <Flex vertical align="center" gap={8}>
                    <Text category="h4" status="danger" style={styles.title}>
                        Sin Conexión
                    </Text>
                    <Text category="p1" style={styles.subtitle}>
                        {error || 'No se puede conectar al servidor.'}
                    </Text>
                </Flex>

                <Text category="p2" appearance="hint" style={styles.instruction}>
                    Por favor, verifica tu conexión a internet e intenta nuevamente.
                </Text>

                <Flex vertical gap={12} style={{ width: '100%' }}>
                    <Button
                        status="primary"
                        onPress={() => dispatch(RESET_AUTH_STATE())}
                        style={styles.button}
                    >
                        REINTENTAR
                    </Button>

                    <Button
                        status="basic"
                        appearance="ghost"
                        onPress={() => dispatch(RESET_AUTH_STATE())}
                        style={styles.button}
                    >
                        VOLVER AL LOGIN
                    </Button>
                </Flex>
            </Flex>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    iconContainer: {
        marginBottom: 10,
    },
    title: {
        textAlign: 'center',
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
        opacity: 0.8,
    },
    instruction: {
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    button: {
        width: '100%',
    },
});