import React from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@ui-kitten/components';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { AgencyCard } from '@/shared/components/common/AgencyCard';
import { ButtonKit } from '@/shared/components';
import { ChildStructure } from '@/shared/services/Structure';

interface Agency {
  id: number;
  name: string;
  total_collected: number;
  net_collected: number;
  premiums_paid: number;
  commissions: number;
  status: string;
  active_draws: number;
}

interface DashboardOperationsProps {
  agencies: ChildStructure[] | null | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardOperations({ agencies, isLoading, onRefresh }: DashboardOperationsProps) {
  const router = useRouter();

  const agencyList: Agency[] = agencies?.map(agency => ({
    id: agency.id,
    name: agency.name,
    total_collected: agency.total_collected || 0,
    net_collected: agency.net_collected || 0,
    premiums_paid: agency.premiums_paid || 0,
    commissions: agency.commissions || 0,
    status: 'active', // Default status since ChildStructure doesn't have status
    active_draws: 0, // Default since ChildStructure doesn't have active_draws
  })) || [];

  return (
    <Flex
      vertical
      flex={1}
      scroll={{
        showsVerticalScrollIndicator: false,
        refreshControl: (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        )
      }}
      padding={[{ type: 'horizontal', value: 20 }, { type: 'bottom', value: 40 }]}
    >
      {/* Agencies List */}
      <Flex vertical gap={5}>
        <Label type="header">Collection Agencies ({agencyList.length})</Label>

        {isLoading ? (
          <Flex align="center" justify="center" margin="l">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </Flex>
        ) : agencyList.length > 0 ? (
          agencyList.map((agency, index) => (
            <AgencyCard
              key={index}
              agency={agency}
              onPress={() => router.push({ pathname: '/colector/details/[id]', params: { id: agency.id, title: agency.name } })}
              onRulesPress={() => router.push({ pathname: '/colector/rules', params: { id_structure: agency.id } })}
            />
          ))
        ) : (
          <Flex align="center" justify="center" margin="l">
            <Text appearance='hint'>No collection agencies available</Text>
          </Flex>
        )}
      </Flex>
      <Flex flex={1} justify="center" margin={[{ type: 'top', value: 20 }]} >
        <ButtonKit
          style={styles.viewAllButton}
          size='giant'
          appearance='filled'
          accessoryRight={<ChevronRight color="white" />}
          label="View All Agencies"
        />
      </Flex>
    </Flex>
  );
}

const styles = StyleSheet.create({
  viewAllButton: {
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.border,
    height: 50,
  },
});
