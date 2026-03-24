import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { ChevronRight } from 'lucide-react-native';

import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { AgencyCard } from '../../../common/agency_card';
import { ButtonKit } from '@/shared/components/button';
import { selectAgencies, useBankerDashboardStore } from '../../core';
import { es } from '@/config/language/es';

export function DashboardOperations() {
  const { model, dispatch } = useBankerDashboardStore();
  const theme = useTheme();
  const agencies = selectAgencies(model);
  const isLoading = model.agencies.type === 'Loading';

  const onSelected = (id: number) => dispatch({ type: 'AGENCY_SELECTED', agencyId: id });
  const onRulesPress = (id: number) => dispatch({ type: 'RULES_PRESSED', agencyId: id });
  const onListPress = (id: number) => dispatch({ type: 'LIST_PRESSED', agencyId: id });

  return (
    <>
      <Flex vertical gap={12}>
        <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 4 }]}>
          <Label type="header" style={{ fontSize: 18 }}>{es.banker.dashboard.operations.activeAgenciesTitle}</Label>
          <Label type="detail" style={{ color: theme['color-primary-500'], fontWeight: '600' }}>{agencies.length} {es.banker.dashboard.operations.activeCount}</Label>
        </Flex>

        {isLoading ? (
          <Flex align="center" justify="center" margin="l">
            <ActivityIndicator size="large" color={theme['color-primary-500']} />
          </Flex>
        ) : agencies.length > 0 ? (
          agencies.map((agency, index) => (
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
          style={[styles.viewAllButton, { 
            backgroundColor: theme['color-primary-500'],
            borderColor: theme['color-primary-500'],
            shadowColor: theme['color-primary-500']
          }]}
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
    height: 56,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
