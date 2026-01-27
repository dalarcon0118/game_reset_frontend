import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Shield, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { Card } from '@/shared/components/card';
import { ChildStructure } from '@/shared/services/structure';
import { es } from '../../language/es';

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
          label: es.banker.dashboard.health.metrics.reserveRatio,
          value: es.banker.dashboard.health.values.na,
          status: 'critical',
          icon: <Shield size={20} color={COLORS.danger} />
        },
        {
          label: es.banker.dashboard.health.metrics.agencyPerformance,
          value: es.banker.dashboard.health.values.na,
          status: 'critical',
          icon: <BarChart3 size={20} color={COLORS.danger} />
        },
        {
          label: es.banker.dashboard.health.metrics.riskLevel,
          value: es.banker.dashboard.health.values.high,
          status: 'critical',
          icon: <AlertTriangle size={20} color={COLORS.danger} />
        },
        {
          label: es.banker.dashboard.health.metrics.growthTrend,
          value: es.banker.dashboard.health.values.na,
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
    const riskLevel = reserveRatio > 80 ? es.banker.dashboard.health.values.low :
                     reserveRatio > 50 ? es.banker.dashboard.health.values.medium : es.banker.dashboard.health.values.high;

    // Growth trend (simplified - would need historical data)
    const growthTrend = netProfit > 0 ? es.banker.dashboard.health.values.positive : es.banker.dashboard.health.values.negative;

    return [
      {
        label: es.banker.dashboard.health.metrics.reserveRatio,
        value: `${reserveRatio.toFixed(1)}%`,
        status: reserveRatio > 70 ? 'excellent' :
                reserveRatio > 40 ? 'good' : 'critical',
        icon: <Shield size={20} color={
          reserveRatio > 70 ? COLORS.success :
          reserveRatio > 40 ? COLORS.warning : COLORS.danger
        } />
      },
      {
        label: es.banker.dashboard.health.metrics.agencyPerformance,
        value: `${avgPerformance.toFixed(1)}%`,
        status: avgPerformance > 75 ? 'excellent' :
                avgPerformance > 50 ? 'good' : 'critical',
        icon: <BarChart3 size={20} color={
          avgPerformance > 75 ? COLORS.success :
          avgPerformance > 50 ? COLORS.warning : COLORS.danger
        } />
      },
      {
        label: es.banker.dashboard.health.metrics.riskLevel,
        value: riskLevel,
        status: riskLevel === es.banker.dashboard.health.values.low ? 'excellent' :
                riskLevel === es.banker.dashboard.health.values.medium ? 'good' : 'critical',
        icon: <AlertTriangle size={20} color={
          riskLevel === es.banker.dashboard.health.values.low ? COLORS.success :
          riskLevel === es.banker.dashboard.health.values.medium ? COLORS.warning : COLORS.danger
        } />
      },
      {
        label: es.banker.dashboard.health.metrics.growthTrend,
        value: growthTrend,
        status: growthTrend === es.banker.dashboard.health.values.positive ? 'excellent' : 'critical',
        icon: <TrendingUp size={20} color={
          growthTrend === es.banker.dashboard.health.values.positive ? COLORS.success : COLORS.danger
        } />
      }
    ];
  };

  const getOverallHealth = (): { status: HealthStatus; label: string } => {
    const metrics = calculateHealthMetrics();
    const excellentCount = metrics.filter(m => m.status === 'excellent').length;
    const goodCount = metrics.filter(m => m.status === 'good').length;

    if (excellentCount >= 3) return { status: 'excellent', label: es.banker.dashboard.health.values.excellent };
    if (excellentCount + goodCount >= 3) return { status: 'good', label: es.banker.dashboard.health.values.good };
    return { status: 'critical', label: es.banker.dashboard.health.values.critical };
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
          <Label type="header" value={es.banker.dashboard.health.title} />
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

        <Flex wrap="wrap" gap={12} justify="between">
          {metrics.map((metric, index) => (
            <Flex
              key={index}
              style={[styles.metricItem]}
            >
              <Flex
                align="center"
                justify="center"
                style={[styles.metricIcon, { backgroundColor: getStatusColor(metric.status) + '20' }]}
              >
                {metric.icon}
              </Flex>
              <Flex vertical flex={1}>
                 <Label type="detail" style={styles.metricLabel} value={metric.label} />
                 <Label type="header" style={styles.metricValue} value={metric.value} />
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}

const styles = StyleSheet.create({
  healthCard: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  statusBadge: {
    borderRadius: 16,
  },
  metricItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  metricLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 14,
  }
});
