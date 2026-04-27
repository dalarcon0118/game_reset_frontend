import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import QRCode from 'react-native-qrcode-svg';
import { VoucherMetadata } from '../../../core/domain/success.types';

interface QRSuccessSealProps {
    metadata: VoucherMetadata;
}

export const QRSuccessSeal: React.FC<QRSuccessSealProps> = ({ metadata }) => {
    const qrValue = metadata.auditUrl || metadata.fingerprintHash || '';

    return (
        <View style={styles.container} collapsable={false}>
            <Text category='c1' style={styles.label}>SELLO DIGITAL ZERO TRUST</Text>
            <View style={styles.qrWrapper}>
                <QRCode
                    value={qrValue}
                    size={200}
                    color="#222B45"
                    backgroundColor="#F7F9FC"
                />
            </View>
            {metadata.fingerprintHash && (
                <Text category='c2' style={styles.fingerprint}>
                    {metadata.fingerprintHash.substring(0, 16)}...{metadata.fingerprintHash.substring(metadata.fingerprintHash.length - 16)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 15,
        padding: 15,
        backgroundColor: '#F7F9FC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E4E9F2',
        borderStyle: 'dashed',
    },
    label: {
        fontWeight: 'bold',
        color: '#8F9BB3',
        marginBottom: 10,
        letterSpacing: 1,
    },
    qrWrapper: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    fingerprint: {
        marginTop: 10,
        color: '#C5CEE0',
        fontFamily: 'monospace',
        fontSize: 10,
    },
});