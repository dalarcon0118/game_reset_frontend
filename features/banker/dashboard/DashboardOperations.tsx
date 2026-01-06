import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@ui-kitten/components';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { AgencyCard } from '../common/AgencyCard';
import { ButtonKit } from '@/shared/components/button';
import { ChildStructure } from '@/shared/services/Structure';
import { es } from '../../language/es';

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
  onSelected: (id: number) => void;
  onRulesPress: (id: number) => void;
  onListPress: (id: number) => void;
}

export function DashboardOperations({
   agencies, 
   isLoading, 
   onRulesPress, 
   onListPress,
   onSelected 
}: DashboardOperationsProps) {
  const router = useRouter();

  const agencyList: Agency[] = agencies?.map(agency => ({
    id: agency.id,
    name: agency.name,
    total_collected: agency.total_collected || 0,
    net_collected: agency.net_collected || 0,
    premiums_paid: agency.premiums_paid || 0,
    commissions: agency.commissions || 0,
    status: 'active', // Default status since ChildStructure doesn't have status
    active_draws: agency.draw_ids?.length || 0,
  })) || [];

  return (
    <>
      <Flex vertical gap={12}>
        <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 4 }]}>
           <Label type="header" style={{ fontSize: 18 }}>{es.banker.dashboard.operations.activeAgenciesTitle}</Label>
           <Label type="detail" style={{ color: COLORS.primary, fontWeight: '600' }}>{agencyList.length} {es.banker.dashboard.operations.activeCount}</Label>
        </Flex>

        {isLoading ? (
          <Flex align="center" justify="center" margin="l">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </Flex>
        ) : agencyList.length > 0 ? (
          agencyList.map((agency, index) => (
            <AgencyCard
              key={index}
              agency={agency}
              onPress={() => onSelected(agency.id)}
              onListPress={() => onListPress(agency.id)}
              onRulesPress={() => onRulesPress(agency.id)}
            />
          ))
        ) : (
          <Flex align="center" justify="center" margin="l">
            <Text appearance='hint'>{es.banker.dashboard.operations.noAgencies}</Text>
          </Flex>
        )}
      </Flex>
      <Flex flex={1} justify="center" margin={[{ type: 'vertical', value: 24 }]} >
        <ButtonKit
          style={styles.viewAllButton}
          size='giant'
          appearance='filled'
          accessoryRight={<ChevronRight color="white" size={20} />}
          label={es.banker.dashboard.operations.viewAll}
        />
      </Flex>
      </>
  );
}

const styles = StyleSheet.create({
  viewAllButton: {
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    height: 56,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
