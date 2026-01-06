import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, Coins, BarChart3, PiggyBank } from 'lucide-react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { GridStatCard } from '../common/GridStatCard';
import { DashboardSummary } from '../services/BankerDashboardService';
import { es } from '../../language/es';

const { width } = Dimensions.get('window');

interface DashboardStatsProps {
  summary: DashboardSummary | null;
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const stats = summary || {
    totalCollected: 0,
    netProfit: 0,
    commissionsPaid: 0,
    bankReserves: 0
  };

  const formattedStats = {
      totalCollected: `$${stats.totalCollected.toLocaleString()}`,
      netProfit: `$${stats.netProfit.toLocaleString()}`,
      commissionsPaid: `$${stats.commissionsPaid.toLocaleString()}`,
      bankReserves: `$${stats.bankReserves.toLocaleString()}`
  };

  return (
    <Flex
      scroll={{ horizontal: true, showsHorizontalScrollIndicator: false }}
      gap={16}
      childrenStyle={{ width: width * 0.45, height: 80 }}
      padding={[{ type: "horizontal", value: 20 }, { type: "bottom", value: 20 }]}
      height={{ value: 100, max: 100 }}
    >
      {/* Total Collected */}
      <GridStatCard
        label={es.banker.dashboard.stats.totalCollected}
        value={formattedStats.totalCollected}
        icon={<TrendingUp size={24} color={COLORS.primary} />}
        barColor={COLORS.primary}
      />

      {/* Net Profit */}
      <GridStatCard
        label={es.banker.dashboard.stats.netProfit}
        value={formattedStats.netProfit}
        icon={<BarChart3 size={24} color={COLORS.success} />}
        barColor={COLORS.success}
      />

      {/* Commissions Paid */}
      <GridStatCard
        label={es.banker.dashboard.stats.commissionsPaid}
        value={formattedStats.commissionsPaid}
        icon={<Coins size={24} color={COLORS.secondary} />}
        barColor={COLORS.secondary}
      />

      {/* Bank Reserves */}
      <GridStatCard
        label={es.banker.dashboard.stats.bankReserves}
        value={formattedStats.bankReserves}
        icon={<PiggyBank size={24} color={COLORS.warning} />}
        barColor={COLORS.warning}
      />
    </Flex>
  );
}

const styles = StyleSheet.create({});
