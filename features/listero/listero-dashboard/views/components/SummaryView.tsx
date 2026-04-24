import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '@ui-kitten/components';
import { Eye, EyeOff, PiggyBank, Wallet, FileText, TrendingUp } from 'lucide-react-native';
import { RemoteData } from '@core/tea-utils';
import { formatCurrency } from '@/shared/utils/formatters';
import { useDashboardStore } from '../../store';
import { TOGGLE_BALANCE_VISIBILITY } from '../../core/msg';
import { styles as summaryStyles } from '../../plugins/summary_plugin/styles';
import { DailySummarySkeleton } from '@/shared/components/moti_skeleton';

const MainMetricCard = ({ icon: Icon, color, bg, label, value, valueColor, badgeText }: any) => (
  <View style={summaryStyles.mainMetricCard}>
    <View style={summaryStyles.mainMetricTopRow}>
      <View style={[summaryStyles.iconContainer, { backgroundColor: bg }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={summaryStyles.metricLabel}>{label}</Text>
      {badgeText && (
        <View style={summaryStyles.percentageBadge}>
          <Text style={summaryStyles.percentageText}>{badgeText}</Text>
        </View>
      )}
    </View>
    <Text style={[summaryStyles.metricValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

const SecondaryMetric = ({ icon: Icon, label, value, valueColor }: any) => (
  <View style={summaryStyles.secondaryItem}>
    <View style={summaryStyles.secondaryHeader}>
      <Icon size={14} color="#8F9BB3" />
      <Text style={summaryStyles.secondaryLabel} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
    </View>
    <Text style={[summaryStyles.secondaryValue, valueColor && { color: valueColor }]} numberOfLines={1}>{value}</Text>
  </View>
);

const LoadingView = () => <DailySummarySkeleton loading={true} />;

export const SummaryView: React.FC = () => {
  const model = useDashboardStore((state) => state.model);
  const dispatch = useDashboardStore((state) => state.dispatch);

  const { dailyTotals, showBalance, commissionRate } = model;
  const hide = (val: number) => showBalance ? formatCurrency(val) : '****';
  const toggleVisibility = () => dispatch(TOGGLE_BALANCE_VISIBILITY());

  return (
    <Card style={summaryStyles.card}>
      <View style={summaryStyles.container}>
        <View style={summaryStyles.header}>
          <Text style={summaryStyles.title}>Resumen del Día</Text>
          <TouchableOpacity onPress={toggleVisibility} style={summaryStyles.eyeIcon}>
            {showBalance ? <EyeOff size={22} color="#8F9BB3" /> : <Eye size={22} color="#8F9BB3" />}
          </TouchableOpacity>
        </View>

        <View style={summaryStyles.mainMetricsContainer}>
          <MainMetricCard
            icon={PiggyBank} color="#00D68F" bg="#E8FBF4"
            label="Ganancia Estimada" value={hide(dailyTotals.estimatedCommission)}
            badgeText={`${Math.round(commissionRate * 100)}%`}
          />
          <MainMetricCard
            icon={Wallet} color="#3366FF" bg="#F0F5FF"
            label="Total a Entregar" value={hide(dailyTotals.amountToRemit)} valueColor="#3366FF"
          />
        </View>

        <View style={summaryStyles.secondaryMetricsRow}>
          <SecondaryMetric icon={FileText} label="Total Vendido" value={hide(dailyTotals.totalCollected)} />
          <SecondaryMetric icon={TrendingUp} label="Premios Pagados" value={hide(dailyTotals.premiumsPaid)} valueColor="#FF3D71" />
        </View>
      </View>
    </Card>
  );
};