import React from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@ui-kitten/components';
import { ChevronRight } from 'lucide-react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { ColectorOperationCard } from '../../components/ColectorOperationCard';
import { ButtonKit } from '@/shared/components';
import { ChildStructure } from '@/shared/services/Structure';
import { useDashboardStore, selectDashboardDispatch } from '../core';
import { NAVIGATE_TO_DETAILS, NAVIGATE_TO_RULES } from '../core/msg';

interface DashboardOperationsProps {
  children: ChildStructure[] | null | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardOperations({ children, isLoading, onRefresh }: DashboardOperationsProps) {
  const dispatch = useDashboardStore(selectDashboardDispatch);

  const childrenList = children || [];

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
      {/* Operations List */}
      <Flex vertical gap={5}>
        <Label type="header">Listas Activas ({childrenList.length})</Label>

        {isLoading ? (
          <Flex align="center" justify="center" margin="l">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </Flex>
        ) : childrenList.length > 0 ? (
          childrenList.map((child, index) => (
            <ColectorOperationCard
              key={index}
              nodeId={child.id}
              name={child.name}
              onPress={() => dispatch(NAVIGATE_TO_DETAILS(child.id, child.name))}
              onReglamentoPress={() => dispatch(NAVIGATE_TO_RULES(child.id))}
            />
          ))
        ) : (
          <Flex align="center" justify="center" margin="l">
            <Text appearance='hint'>No hay listas activas para hoy</Text>
          </Flex>
        )}
      </Flex>
      <Flex flex={1} justify="center" margin={[{ type: 'top', value: 20 }]} >
        <ButtonKit
          style={styles.viewAllButton}
          size='giant'
          appearance='filled'
          accessoryRight={<ChevronRight color="white" />}
          label="Ver todas las listas"
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
