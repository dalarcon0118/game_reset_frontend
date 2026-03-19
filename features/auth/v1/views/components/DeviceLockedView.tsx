import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, Layout } from '@ui-kitten/components';
import { Flex } from '@/shared/components';
import { deviceRepository } from '@/shared/repositories/system/device';
import { logger } from '@/shared/utils/logger';
import { useAuthV1 } from '../../hooks/use_auth';
import { RESET_AUTH_STATE } from '@/shared/auth/v1/msg';

const log = logger.withTag('DEVICE_LOCKED_VIEW');

interface DeviceLockedViewProps {
    error?: string | null;
}

export const DeviceLockedView: React.FC<DeviceLockedViewProps> = ({ error }) => {
    const [deviceId, setDeviceId] = useState<string>('Cargando...');
    const { dispatch } = useAuthV1();

    useEffect(() => {
        deviceRepository.getUniqueId().then(setDeviceId).catch(err => {
            log.error('Failed to get device ID for display', err);
            setDeviceId('Error al obtener ID');
        });
    }, []);

    return (
        <Layout style={styles.container}>
            <Flex vertical align="center" justify="center" gap={24} padding="xl" style={{ flex: 1 }}>
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 60 }}>📱🔒</Text>
                </View>

                <Flex vertical align="center" gap={8}>
                    <Text category="h4" status="danger" style={styles.title}>
                        Dispositivo No Autorizado
                    </Text>
                    <Text category="p1" style={styles.subtitle}>
                        {error || 'Esta cuenta está vinculada a otro dispositivo.'}
                    </Text>
                </Flex>

                <View style={styles.infoBox}>
                    <Text category="label" appearance="hint">ID DE TU DISPOSITIVO:</Text>
                    <Text category="p2" style={styles.deviceId}>
                        {deviceId}
                    </Text>
                </View>

                <Text category="p2" appearance="hint" style={styles.instruction}>
                    Por favor, contacta al equipo de soporte y proporciónales el ID de arriba para autorizar este dispositivo.
                </Text>

                <Flex vertical gap={12} style={{ width: '100%' }}>
                    <Button 
                        status="primary" 
                        onPress={() => {/* Aquí se podría abrir WhatsApp o Mail */}}
                        style={styles.button}
                    >
                        CONTACTAR SOPORTE
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
    infoBox: {
        backgroundColor: '#F7F9FC',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EDF1F7',
    },
    deviceId: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#222B45',
    },
    instruction: {
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    button: {
        marginTop: 10,
        width: '100%',
    },
});
