import React from 'react';
import { StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@ui-kitten/components';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { OperationCard } from '../../common/OperationCard';
import { ButtonKit } from '@/shared/components';
import { ChildStructure } from '@/shared/services/Structure';

interface Operation {
  id: number;
  name: string;
  draw: string;
  total: string;
  net: string;
  loosed: string;
  commission: string;
}

interface DashboardOperationsProps {
  children: ChildStructure[] | null | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardOperations({ children, isLoading, onRefresh }: DashboardOperationsProps) {
  const router = useRouter();

  const operations: Operation[] = children?.map(child => ({
    id: child.id,
    name: child.name,
    draw: child.draw_name || 'N/A',
    total: `$${child.total_collected.toLocaleString()}`,
    net: `$${child.net_collected.toLocaleString()}`,
    loosed: `$${child.premiums_paid.toLocaleString()}`,
    commission: `$${child.commissions.toLocaleString()}`,
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
      {/* Operations List */}
      <Flex vertical gap={5}>
        <Label type="header">Listas Activas ({operations.length})</Label>

        {isLoading ? (
          <Flex align="center" justify="center" margin="l">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </Flex>
        ) : operations.length > 0 ? (
          operations.map((op, index) => (
            <OperationCard
              key={index}
              operation={op}
              onPress={() => router.push({ pathname: '/colector/details/[id]', params: { id: op.id, title: op.name } })}
              onReglamentoPress={() => router.push({ pathname: '/colector/rules', params: { id_structure: op.id } })}
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
