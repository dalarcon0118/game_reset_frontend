import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, Layout } from '@ui-kitten/components';
import { Flex } from '@/shared/components';
import { useAuthV1 } from '../../hooks/use_auth';
import { useLoginUI } from '../../hooks/use_login_ui';
import { RESET_AUTH_STATE } from '@/shared/auth/v1/msg';
import { LOGIN_REQUESTED } from '@/shared/auth/v1/msg';

interface ConnectionErrorViewProps {
    error?: string | null;
}

export const ConnectionErrorView: React.FC<ConnectionErrorViewProps> = ({ error }) => {
    const { dispatch } = useAuthV1();
    const { username, pin } = useLoginUI();
    const hasRetried = useRef(false);

    useEffect(() => {
        if (username && pin.length === 6 && !hasRetried.current) {
            hasRetried.current = true;
            const retryTimeout = setTimeout(() => {
                dispatch(LOGIN_REQUESTED({ username, pin }));
            }, 1500);
            return () => clearTimeout(retryTimeout);
        }
    }, [username, pin, dispatch]);

    // Detectar si es un error de base de datos para mostrar título específico
    const isDatabaseError = error?.toLowerCase().includes('base de datos') || 
                            error?.toLowerCase().includes('database') ||
                            error?.toLowerCase().includes('connection refused');
    
    return (
        <Layout style={styles.container}>
            <Flex vertical align="center" justify="center" gap={24} padding="xl" style={{ flex: 1 }}>
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 60 }}>{isDatabaseError ? '🗄️❌' : '📡❌'}</Text>
                </View>

                <Flex vertical align="center" gap={8}>
                    <Text category="h4" status="danger" style={styles.title}>
                        {isDatabaseError ? 'Servicio Temporarily No Disponible' : 'Sin Conexión'}
                    </Text>
                    <Text category="p1" style={styles.subtitle}>
                        {error || 'No se puede conectar al servidor.'}
                    </Text>
                </Flex>

                <Text category="p2" appearance="hint" style={styles.instruction}>
                    {isDatabaseError 
                        ? 'El servidor está experimentando problemas técnicos. Por favor, intenta más tarde.'
                        : 'Por favor, verifica tu conexión a internet e intenta nuevamente.'}
                </Text>

                <Flex vertical gap={12} style={{ width: '100%' }}>
                    <Button
                        status="primary"
                        onPress={() => {
                            if (username && pin.length === 6) {
                                dispatch(LOGIN_REQUESTED({ username, pin }));
                            } else {
                                dispatch(RESET_AUTH_STATE());
                            }
                        }}
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