import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, Coins, BarChart3, Percent } from 'lucide-react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { GridStatCard } from '../../common/GridStatCard';
import { useDashboardStore } from '../core';
import { RemoteData } from '@/shared/core/remote.data';

const { width } = Dimensions.get('window');

export function DashboardStats() {
  const { model } = useDashboardStore();

   const stats = RemoteData.withDefault({
    total: 0,
    pending: 0,
    completed: 0,
    netTotal: '--',
    grossTotal: '--',
    commissions: '--',
    dailyProfit: '--',
  }, model.stats);

  return (
    <Flex
      scroll={{ horizontal: true, showsHorizontalScrollIndicator: false }}
      gap={12}
      childrenStyle={{ width: width * 0.45, height: 80 }}
      margin={[{ type: "left", value: 20 }]}
      height={{ value: 100, max: 100 }}
    >
      {/* Card 1: Net Total */}
      <GridStatCard
        label="Total"
        value={stats.netTotal}
        icon={<TrendingUp size={24} color={COLORS.primary} />}
        barColor={COLORS.primary}
      />

      {/* Card 2: Gross Total */}

      {/* Card 3: Commissions */}
      <GridStatCard
        label="Comisión"
        value={stats.commissions}
        icon={<Coins size={24} color={COLORS.secondary} />}
        barColor={COLORS.secondary}
      />
      <GridStatCard
        label="Perdido"
        value={stats.grossTotal}
        icon={<BarChart3 size={24} color={COLORS.textLight} />}
        barColor={COLORS.textLight}
      />
      {/* Card 4: Daily Profit */}
      <GridStatCard
        label="Ganado"
        value={stats.dailyProfit}
        icon={<Percent size={24} color={COLORS.textLight} />}
        barColor={COLORS.success}
      />
    </Flex>
  );
}

const styles = StyleSheet.create({});
