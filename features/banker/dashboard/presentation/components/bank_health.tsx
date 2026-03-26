import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Shield, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react-native';
import { useTheme } from '@ui-kitten/components';

import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { Card } from '@/shared/components/card';
import { es } from '@/config/language/es';
import { HealthStatus, selectHealthMetrics, selectOverallHealth, useBankerDashboardStore } from '../../core';

/**
 * 🎨 HELPER: Get status color from theme
 */
const getStatusColor = (status: HealthStatus, theme: any) => {
  switch (status) {
    case 'excellent': return theme['color-success-600'];
    case 'good': return theme['color-warning-600'];
    case 'critical': return theme['color-danger-600'];
    case 'unknown': return theme['color-basic-500'];
    default: return theme['color-basic-600'];
  }
};

/**
 * 🎨 HELPER: Get icon for specific metric
 */
const MetricIcon = ({ id, status, theme }: { id: string; status: HealthStatus; theme: any }) => {
  const color = getStatusColor(status, theme);
  const size = 20;

  switch (id) {
    case 'reserve': return <Shield size={size} color={color} />;
    case 'performance': return <BarChart3 size={size} color={color} />;
    case 'risk': return <AlertTriangle size={size} color={color} />;
    case 'trend': return <TrendingUp size={size} color={color} />;
    default: return <BarChart3 size={size} color={color} />;
  }
};

export function BankHealth() {
  const { model } = useBankerDashboardStore();
  const theme = useTheme();
  
  const metrics = selectHealthMetrics(model);
  const overallHealth = selectOverallHealth(model);

  const overallColor = useMemo(() => getStatusColor(overallHealth.status, theme), [overallHealth.status, theme]);

  return (
    <Card 
      padding={0} 
      style={[
        styles.healthCard, 
        { 
          backgroundColor: theme['background-basic-color-1'],
          borderTopWidth: 4,
          borderTopColor: overallColor
        }
      ]}
    >
      <Flex vertical padding="m">
        {/* Header Section */}
        <Flex justify="between" align="center" margin={{ type: 'bottom', value: 'm' }} padding={[{ type: 'horizontal', value: 's' }]}>
          <Flex align="center">
            <Shield size={18} color={theme['text-basic-color']} style={{ marginRight: 8 }} />
            <Label type="header" style={{ fontSize: 15 }} value={es.banker.dashboard.health.title} />
          </Flex>
          
          <View style={[
            styles.statusBadge, 
            { backgroundColor: overallHealth.status === 'critical' ? theme['color-danger-500'] : `${overallColor}20` }
          ]}>
            <Label
              type="detail"
              value={overallHealth.label}
              style={{ color: overallHealth.status === 'critical' ? 'white' : overallColor, fontWeight: '800', fontSize: 12 }}
            />
          </View>
        </Flex>

        {/* Metrics Grid */}
        <Flex wrap="wrap" gap={8} justify="between">
          {metrics.map((metric) => {
            const metricColor = getStatusColor(metric.status, theme);
            
            return (
              <Flex
                key={metric.id}
                width="48.5%"
                align="center"
                padding="s"
                rounded={{ radius: 12 }}
                style={[
                  styles.metricItem,
                  { backgroundColor: theme['background-basic-color-2'] }
                ]}
              >
                {/* Icon Container */}
                <Flex
                  align="center"
                  justify="center"
                  width={32}
                  height={32}
                  rounded={{ radius: 10 }}
                  style={{ backgroundColor: `${metricColor}15` }}
                  margin={{ type: 'right', value: 's' }}
                >
                  <MetricIcon id={metric.id} status={metric.status} theme={theme} />
                </Flex>

                {/* Text Content */}
                <Flex vertical flex={1} justify="center">
                   <Label 
                    type="detail" 
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ 
                      color: theme['text-hint-color'], 
                      marginBottom: 0, 
                      fontSize: 12, 
                      fontWeight: '600'
                    }} 
                    value={metric.label} 
                   />
                   <Label 
                    type="number" 
                    style={{ fontSize: 16, fontWeight: '800', color: metricColor, lineHeight: 22 }} 
                    value={metric.value} 
                   />
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
    </Card>
  );
}

const styles = StyleSheet.create({
  healthCard: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden'
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  metricItem: {
    minHeight: 64,
  }
});
