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
      {agencies.length > 3 && (
        <Flex justify="center" margin={[{ type: 'vertical', value: 20 }]} >
          <ButtonKit
            style={[styles.viewAllButton, { 
              backgroundColor: theme['background-basic-color-2'],
              borderColor: theme['border-basic-color-3'],
            }]}
            size='medium'
            appearance='outline'
            accessoryRight={(props) => <ChevronRight {...props} color={theme['color-primary-500']} size={18} />}
            labelStyle={{ color: theme['color-primary-500'], fontWeight: '700' }}
            label={es.banker.dashboard.operations.viewAll}
          />
        </Flex>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  viewAllButton: {
    borderRadius: 12,
    minWidth: '60%',
    height: 48,
  },
});
