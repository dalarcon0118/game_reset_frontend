import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { match } from 'ts-pattern';
import { Card } from '@/shared/components';
import { FormattedBet, VoucherMetadata } from '../../core/domain/success.types';
import { VoucherHeader } from './sections/VoucherHeader';
import { VoucherStandardBody } from './sections/VoucherStandardBody';
import { VoucherLoteriaBody } from './sections/VoucherLoteriaBody';
import { VoucherBolitaBody } from './sections/VoucherBolitaBody';
import { VoucherFooter } from './sections/VoucherFooter';
import { LoteriaInfoBox } from './parts/LoteriaInfoBox';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUCCESS_VOUCHER');

const isLoteriaBet = (betType: string): boolean => {
    const normalized = betType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const result = normalized.includes('loteria') || normalized.includes('cuaterna');
    log.info(`[DEBUG] isLoteriaBet("${betType}") = ${result} (normalized: "${normalized}")`);
    return result;
};

type VoucherBodyState = 
    | { type: 'bolita'; bets: FormattedBet[]; groupedBets: NonNullable<VoucherProps['groupedBets']> }
    | { type: 'loteria_and_standard'; bets: FormattedBet[] }
    | { type: 'standard_only'; bets: FormattedBet[] };

interface SuccessVoucherProps {
    drawId: string | null;
    receiptCode: string;
    bets: FormattedBet[];
    totalAmount: number;
    metadata: VoucherMetadata;
    isBolita?: boolean;
    groupedBets?: {
        fijosCorridos: FormattedBet[];
        parlets: FormattedBet[];
        centenas: FormattedBet[];
    } | null;
}

type VoucherProps = SuccessVoucherProps;

const getBodyState = (props: VoucherProps): VoucherBodyState => {
    const { bets, isBolita, groupedBets } = props;

    log.info('[DEBUG] getBodyState called:', {
        isBolita,
        betsCount: bets.length,
        betsTypes: bets.map(b => b.type),
        groupedBetsKeys: groupedBets ? Object.keys(groupedBets) : null,
        loteriaCount: bets.filter(b => isLoteriaBet(b.type)).length
    });

    if (isBolita) {
        log.info('[DEBUG] Returning body state: bolita');
        return { type: 'bolita', bets, groupedBets: groupedBets! };
    }

    const isAnyLoteria = bets.some(b => isLoteriaBet(b.type));

    if (isAnyLoteria) {
        log.info('[DEBUG] Returning body state: loteria_and_standard');
        return { type: 'loteria_and_standard', bets };
    }

    log.info('[DEBUG] Returning body state: standard_only');
    return { type: 'standard_only', bets };
};

const VoucherBody: React.FC<{ state: VoucherBodyState }> = ({ state }) => {
    return match(state)
        .with({ type: 'bolita' }, ({ bets, groupedBets }) => (
            <VoucherBolitaBody bets={bets} groupedBets={groupedBets} />
        ))
        .with({ type: 'loteria_and_standard' }, ({ bets }) => (
            <>
                <VoucherLoteriaBody bets={bets} />
                <VoucherStandardBody bets={bets} />
            </>
        ))
        .with({ type: 'standard_only' }, ({ bets }) => (
            <VoucherStandardBody bets={bets} />
        ))
        .exhaustive();
};

export const SuccessVoucher: React.FC<SuccessVoucherProps> = (props) => {
    const { drawId, receiptCode, bets, totalAmount, metadata } = props;
    const isAnyLoteria = bets.some(b => isLoteriaBet(b.type));
    const bodyState = getBodyState(props);

    return (
        <Card style={styles.card} collapsable={false}>
            <VoucherHeader
                receiptCode={receiptCode}
                drawId={drawId}
                metadata={metadata}
                isAnyLoteria={isAnyLoteria}
            />

            {isAnyLoteria && <LoteriaInfoBox />}

            <VoucherBody state={bodyState} />

            <View style={styles.divider} />

            <View style={styles.totalRow} collapsable={false}>
                <Text category='h6' style={styles.totalLabel}>Total</Text>
                <Text category='h6' status='primary' style={styles.totalAmount}>${totalAmount}</Text>
            </View>

            <VoucherFooter metadata={metadata} />
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E9F2',
        marginVertical: 15,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    totalLabel: {
        color: '#222B45',
    },
    totalAmount: {
        fontWeight: 'bold',
    },
});