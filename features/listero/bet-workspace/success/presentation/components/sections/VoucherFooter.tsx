import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { VoucherMetadata } from '../../core/domain/success.types';
import { QRSuccessSeal } from '../parts/QRSuccessSeal';
import { QRErrorSeal } from '../parts/QRErrorSeal';

interface VoucherFooterProps {
    metadata: VoucherMetadata;
}

export const VoucherFooter: React.FC<VoucherFooterProps> = ({ metadata }) => {
    const hasSealData = metadata.auditUrl || metadata.fingerprintHash;

    return (
        <>
            <View style={styles.divider} />

            {hasSealData ? (
                <QRSuccessSeal metadata={metadata} />
            ) : (
                <QRErrorSeal metadata={metadata} />
            )}

            <View style={styles.disclaimerContainer} collapsable={false}>
                <Text category='c1' appearance='hint' style={styles.disclaimerText}>
                    {metadata.disclaimer}
                </Text>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    divider: {
        height: 1,
        backgroundColor: '#E4E9F2',
        marginVertical: 15,
    },
    disclaimerContainer: {
        paddingTop: 5,
    },
    disclaimerText: {
        textAlign: 'center',
        lineHeight: 16,
        fontSize: 11,
        fontStyle: 'italic',
    },
});