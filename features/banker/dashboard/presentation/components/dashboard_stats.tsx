import React from 'react';
import { Dimensions } from 'react-native';
import { TrendingUp, Coins, BarChart3, PiggyBank } from 'lucide-react-native';
import { useTheme } from '@ui-kitten/components';

import { Flex } from '@/shared/components/flex';
import { GridStatCard } from '../../../common/grid_stat_card';
import { selectDashboardStats, StatViewModel, useBankerDashboardStore } from '../../core';

const { width } = Dimensions.get('window');

export function DashboardStats() {
  const { model } = useBankerDashboardStore();
  const theme = useTheme();
  const stats = selectDashboardStats(model);

  const getStatIcon = (type: StatViewModel['type']) => {
    switch (type) {
      case 'collected': return <TrendingUp size={24} color={theme['color-primary-500']} />;
      case 'profit': return <BarChart3 size={24} color={theme['color-success-500']} />;
      case 'commissions': return <Coins size={24} color={theme['color-secondary-500']} />;
      case 'reserves': return <PiggyBank size={24} color={theme['color-warning-500']} />;
    }
  };

  const getStatColor = (type: StatViewModel['type']) => {
    switch (type) {
      case 'collected': return theme['color-primary-500'];
      case 'profit': return theme['color-success-500'];
      case 'commissions': return theme['color-secondary-500'];
      case 'reserves': return theme['color-warning-500'];
    }
  };

  return (
    <Flex
      scroll={{ horizontal: true, showsHorizontalScrollIndicator: false }}
      gap={16}
      childrenStyle={{ width: width * 0.45, height: 80 }}
      padding={[{ type: "horizontal", value: 20 }, { type: "bottom", value: 20 }]}
      height={{ value: 100, max: 100 }}
    >
      {stats.map((stat, index) => (
        <GridStatCard
          key={index}
          label={stat.label}
          value={stat.value}
          icon={getStatIcon(stat.type)}
          barColor={getStatColor(stat.type)}
        />
      ))}
    </Flex>
  );
}
