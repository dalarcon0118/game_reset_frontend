import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Shield, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { Card } from '@/shared/components/card';
import { ChildStructure } from '@/shared/services/Structure';

const { width } = Dimensions.get('window');

interface BankHealthProps {
  agencies?: ChildStructure[] | null;
}

type HealthStatus = 'excellent' | 'good' | 'critical';

interface HealthMetric {
  label: string;
  value: string;
  status: HealthStatus;
  icon: React.ReactNode;
}

export function BankHealth({ agencies }: BankHealthProps) {
  const calculateHealthMetrics = (): HealthMetric[] => {
    if (!agencies || agencies.length === 0) {
      return [
        {
          label: 'Reserve Ratio',
          value: 'N/A',
          status: 'critical',
          icon: <Shield size={20} color={COLORS.danger} />
        },
        {
          label: 'Agency Performance',
          value: 'N/A',
          status: 'critical',
          icon: <BarChart3 size={20} color={COLORS.danger} />
        },
        {
          label: 'Risk Level',
          value: 'High',
          status: 'critical',
          icon: <AlertTriangle size={20} color={COLORS.danger} />
        },
        {
          label: 'Growth Trend',
          value: 'N/A',
          status: 'critical',
          icon: <TrendingUp size={20} color={COLORS.danger} />
        }
      ];
    }

    // Calculate metrics
    const totalCollected = agencies.reduce((sum, agency) => sum + (agency.total_collected || 0), 0);
    const netProfit = agencies.reduce((sum, agency) => sum + (agency.net_collected || 0), 0);
    const premiumsPaid = agencies.reduce((sum, agency) => sum + (agency.premiums_paid || 0), 0);

    // Reserve ratio (simplified - in real app this would be more complex)
    const reserveRatio = totalCollected > 0 ? ((netProfit / totalCollected) * 100) : 0;

    // Agency performance (average net collection rate)
    const avgPerformance = agencies.length > 0 ?
      agencies.reduce((sum, agency) => {
        const collected = agency.total_collected || 0;
        const net = agency.net_collected || 0;
        return sum + (collected > 0 ? (net / collected) * 100 : 0);
      }, 0) / agencies.length : 0;

    // Risk level based on reserve ratio and performance
    const riskLevel = reserveRatio > 80 ? 'Low' :
                     reserveRatio > 50 ? 'Medium' : 'High';

    // Growth trend (simplified - would need historical data)
    const growthTrend = netProfit > 0 ? 'Positive' : 'Negative';

    return [
      {
        label: 'Reserve Ratio',
        value: `${reserveRatio.toFixed(1)}%`,
        status: reserveRatio > 70 ? 'excellent' :
                reserveRatio > 40 ? 'good' : 'critical',
        icon: <Shield size={20} color={
          reserveRatio > 70 ? COLORS.success :
          reserveRatio > 40 ? COLORS.warning : COLORS.danger
        } />
      },
      {
        label: 'Agency Performance',
        value: `${avgPerformance.toFixed(1)}%`,
        status: avgPerformance > 75 ? 'excellent' :
                avgPerformance > 50 ? 'good' : 'critical',
        icon: <BarChart3 size={20} color={
          avgPerformance > 75 ? COLORS.success :
          avgPerformance > 50 ? COLORS.warning : COLORS.danger
        } />
      },
      {
        label: 'Risk Level',
        value: riskLevel,
        status: riskLevel === 'Low' ? 'excellent' :
                riskLevel === 'Medium' ? 'good' : 'critical',
        icon: <AlertTriangle size={20} color={
          riskLevel === 'Low' ? COLORS.success :
          riskLevel === 'Medium' ? COLORS.warning : COLORS.danger
        } />
      },
      {
        label: 'Growth Trend',
        value: growthTrend,
        status: growthTrend === 'Positive' ? 'excellent' : 'critical',
        icon: <TrendingUp size={20} color={
          growthTrend === 'Positive' ? COLORS.success : COLORS.danger
        } />
      }
    ];
  };

  const getOverallHealth = (): { status: HealthStatus; label: string } => {
    const metrics = calculateHealthMetrics();
    const excellentCount = metrics.filter(m => m.status === 'excellent').length;
    const goodCount = metrics.filter(m => m.status === 'good').length;

    if (excellentCount >= 3) return { status: 'excellent', label: 'Excellent' };
    if (excellentCount + goodCount >= 3) return { status: 'good', label: 'Good' };
    return { status: 'critical', label: 'Critical' };
  };

  const metrics = calculateHealthMetrics();
  const overallHealth = getOverallHealth();

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'excellent': return COLORS.success;
      case 'good': return COLORS.warning;
      case 'critical': return COLORS.danger;
    }
  };

  return (
    <Card style={styles.healthCard}>
      <Flex vertical padding="l">
        <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 16 }]}>
          <Label type="header" value="Bank Health Status" />
          <Flex
            align="center"
            padding={[{ type: 'horizontal', value: 12 }, { type: 'vertical', value: 6 }]}
            style={[styles.statusBadge, { backgroundColor: getStatusColor(overallHealth.status) + '20' }]}
          >
            <Label
              type="detail"
              value={overallHealth.label}
              style={{ color: getStatusColor(overallHealth.status) }}
            />
          </Flex>
        </Flex>

        <Flex wrap="wrap" gap={16}>
          {metrics.map((metric, index) => (
            <Flex
              key={index}
              vertical
              align="center"
              style={styles.metricItem}
            >
              <Flex
                align="center"
                justify="center"
                style={[styles.metricIcon, { backgroundColor: getStatusColor(metric.status) + '20' }]}
              >
                {metric.icon}
              </Flex>
              <Label type="detail" style={styles.metricLabel} value={metric.label} />
              <Label type="number" style={styles.metricValue} value={metric.value} />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}

const styles = StyleSheet.create({
  healthCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  statusBadge: {
    borderRadius: 16,
  },
  metricItem: {
    width: (width - 80) / 4, // 4 metrics per row
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
