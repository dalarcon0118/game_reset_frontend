import React from 'react';
import { View, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { ColumnHeaders } from '@/features/bet-workspace/shared/components/column_headers';
import { BolitaListGroup } from './BolitaListGroup';
import { BolitaListFooter } from './BolitaListFooter';
import { GroupedBets } from '../utils/list_grouping';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BolitaListSuccessView');

interface BolitaListSuccessViewProps {
    groupedBets: GroupedBets;
    totals: {
        fijosCorridosTotal: number;
        parletsTotal: number;
        centenasTotal: number;
        grandTotal: number;
    };
    isRefreshing: boolean;
    onRefresh: () => void;
    onViewReceipt: (receiptCode: string) => void;
}

export const SuccessView: React.FC<BolitaListSuccessViewProps> = ({
    groupedBets,
    totals,
    isRefreshing,
    onRefresh,
    onViewReceipt,
}) => {
    const colorScheme = (useColorScheme() ?? 'light') as keyof typeof Colors;

    return (
        <View style={{ flex: 1 }}>
            <ColumnHeaders />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    minHeight: '101%',
                }}
                alwaysBounceVertical={true}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={!!isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors[colorScheme].primary}
                    />
                }
            >
                {Object.entries(groupedBets).map(([receiptCode, group]) => {
                     log.debug('Rendering group', JSON.stringify(group, null, 2));
                    return (
                        <BolitaListGroup
                            key={receiptCode}
                            receiptCode={receiptCode}
                            group={group}
                            onViewReceipt={onViewReceipt}
                        />
                    );
                })}
            </ScrollView>
            <BolitaListFooter
                fijosCorridosTotal={totals.fijosCorridosTotal}
                parletsTotal={totals.parletsTotal}
                centenasTotal={totals.centenasTotal}
                grandTotal={totals.grandTotal}
            />
        </View>
    );
};
