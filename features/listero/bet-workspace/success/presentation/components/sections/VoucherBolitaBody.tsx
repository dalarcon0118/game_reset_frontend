import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { match } from 'ts-pattern';
import { FormattedBet } from '../../core/domain/success.types';
import { BET_TYPE_KEYS } from '@/shared/types/bet_types';
import { BetRow } from '../parts/BetRow';
import { FijosCorridosTable } from '../parts/FijosCorridosTable';
import { ParletsTable } from '../parts/ParletsTable';
import { CentenasTable } from '../parts/CentenasTable';

type BolitaSection = 
    | { section: 'fijosCorridos'; bets: FormattedBet[] }
    | { section: 'parlets'; bets: FormattedBet[] }
    | { section: 'centenas'; bets: FormattedBet[] }
    | { section: 'other'; bets: FormattedBet[] };

interface VoucherBolitaBodyProps {
    bets: FormattedBet[];
    groupedBets: {
        fijosCorridos: FormattedBet[];
        parlets: FormattedBet[];
        centenas: FormattedBet[];
    } | null;
}

const EXCLUDED_BET_TYPES = [
    'Fijo/Corrido', 
    BET_TYPE_KEYS.PARLET, 
    BET_TYPE_KEYS.CENTENA, 
    BET_TYPE_KEYS.FIJO, 
    BET_TYPE_KEYS.CORRIDO
] as const;

const getBolitaSections = (props: VoucherBolitaBodyProps): BolitaSection[] => {
    const { bets, groupedBets } = props;
    
    if (!groupedBets) return [];

    const sections: BolitaSection[] = [];

    if (groupedBets.fijosCorridos.length > 0) {
        sections.push({ section: 'fijosCorridos', bets: groupedBets.fijosCorridos });
    }
    if (groupedBets.parlets.length > 0) {
        sections.push({ section: 'parlets', bets: groupedBets.parlets });
    }
    if (groupedBets.centenas.length > 0) {
        sections.push({ section: 'centenas', bets: groupedBets.centenas });
    }

    const otherBets = bets.filter(b => !EXCLUDED_BET_TYPES.includes(b.type as typeof EXCLUDED_BET_TYPES[number]));
    if (otherBets.length > 0) {
        sections.push({ section: 'other', bets: otherBets });
    }

    return sections;
};

const BolitaSectionRenderer: React.FC<{ section: BolitaSection }> = ({ section }) => {
    return match(section)
        .with({ section: 'fijosCorridos' }, ({ bets }) => (
            <FijosCorridosTable bets={bets} />
        ))
        .with({ section: 'parlets' }, ({ bets }) => (
            <ParletsTable bets={bets} />
        ))
        .with({ section: 'centenas' }, ({ bets }) => (
            <CentenasTable bets={bets} />
        ))
        .with({ section: 'other' }, ({ bets }) => (
            <View style={styles.otherSection} collapsable={false}>
                <View style={styles.divider} />
                <Text category='s1' style={styles.sectionTitle}>OTRAS APUESTAS</Text>
                {bets.map((bet, index) => (
                    <BetRow key={bet.id || index} bet={bet} />
                ))}
            </View>
        ))
        .exhaustive();
};

export const VoucherBolitaBody: React.FC<VoucherBolitaBodyProps> = (props) => {
    const sections = getBolitaSections(props);

    return (
        <View style={styles.container} collapsable={false}>
            {sections.map((section, index) => (
                <BolitaSectionRenderer key={index} section={section} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
    },
    otherSection: {
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#E4E9F2',
        marginVertical: 15,
    },
    sectionTitle: {
        color: '#8F9BB3',
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 15,
    },
});