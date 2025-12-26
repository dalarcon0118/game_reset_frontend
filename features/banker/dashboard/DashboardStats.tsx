import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, Coins, BarChart3, PiggyBank } from 'lucide-react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { GridStatCard } from '../common/GridStatCard';
import { ChildStructure } from '@/shared/services/Structure';

const { width } = Dimensions.get('window');

interface DashboardStatsProps {
  agencies?: ChildStructure[] | null;
}

export function DashboardStats({ agencies }: DashboardStatsProps) {
  // Calculate stats from agencies data
  const calculateStats = () => {
    if (!agencies || agencies.length === 0) {
      return {
        totalCollected: '$0',
        netProfit: '$0',
        commissionsPaid: '$0',
        bankReserves: '$0'
      };
    }

    const totalCollected = agencies.reduce((sum, agency) => sum + (agency.total_collected || 0), 0);
    const netProfit = agencies.reduce((sum, agency) => sum + (agency.net_collected || 0), 0);
    const commissionsPaid = agencies.reduce((sum, agency) => sum + (agency.commissions || 0), 0);
    const premiumsPaid = agencies.reduce((sum, agency) => sum + (agency.premiums_paid || 0), 0);

    // Bank reserves = net profit - premiums paid
    const bankReserves = netProfit - premiumsPaid;

    return {
      totalCollected: `$${totalCollected.toLocaleString()}`,
      netProfit: `$${netProfit.toLocaleString()}`,
      commissionsPaid: `$${commissionsPaid.toLocaleString()}`,
      bankReserves: `$${Math.max(0, bankReserves).toLocaleString()}`
    };
  };

  const stats = calculateStats();

  return (
    <Flex
      scroll={{ horizontal: true, showsHorizontalScrollIndicator: false }}
      gap={12}
      childrenStyle={{ width: width * 0.45, height: 80 }}
      margin={[{ type: "left", value: 20 }]}
      height={{ value: 100, max: 100 }}
    >
      {/* Total Collected */}
      <GridStatCard
        label="Total Collected"
        value={stats.totalCollected}
        icon={<TrendingUp size={24} color={COLORS.primary} />}
        barColor={COLORS.primary}
      />

      {/* Net Profit */}
      <GridStatCard
        label="Net Profit"
        value={stats.netProfit}
        icon={<BarChart3 size={24} color={COLORS.success} />}
        barColor={COLORS.success}
      />

      {/* Commissions Paid */}
      <GridStatCard
        label="Commissions Paid"
        value={stats.commissionsPaid}
        icon={<Coins size={24} color={COLORS.secondary} />}
        barColor={COLORS.secondary}
      />

      {/* Bank Reserves */}
      <GridStatCard
        label="Bank Reserves"
        value={stats.bankReserves}
        icon={<PiggyBank size={24} color={COLORS.warning} />}
        barColor={COLORS.warning}
      />
    </Flex>
  );
}

const styles = StyleSheet.create({});
