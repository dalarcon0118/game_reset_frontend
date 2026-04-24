import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '@ui-kitten/components';
import { Eye, EyeOff, PiggyBank, Wallet, FileText, TrendingUp } from 'lucide-react-native';
import { formatCurrency } from '@/shared/utils/formatters';
import { useDashboardStore } from '../../store';
import { TOGGLE_BALANCE_VISIBILITY } from '../../core/msg';
import { summaryStyles } from '../../core/styles';

const MainMetricCard = ({ icon: Icon, color, bg, label, value, badgeText }: any) => (
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
    <Text style={summaryStyles.metricValue}>{value}</Text>
  </View>
);

const SecondaryMetric = ({ icon: Icon, label, value }: any) => (
  <View style={summaryStyles.secondaryItem}>
    <View style={summaryStyles.secondaryHeader}>
      <Icon size={14} color="#8F9BB3" />
      <Text style={summaryStyles.secondaryLabel} numberOfLines={1}>{label}</Text>
    </View>
    <Text style={summaryStyles.secondaryValue} numberOfLines={1}>{value}</Text>
  </View>
);

export const SummaryView: React.FC = () => {
  const model = useDashboardStore((s) => s.model);
  const dispatch = useDashboardStore((s) => s.dispatch);
  const { dailyTotals, showBalance, commissionRate } = model;

  const formatValue = (val: number) => showBalance ? formatCurrency(val) : '****';
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
            label="Ganancia Estimada" value={formatValue(dailyTotals.estimatedCommission)}
            badgeText={`${Math.round(commissionRate * 100)}%`}
          />
          <MainMetricCard
            icon={Wallet} color="#3366FF" bg="#F0F5FF"
            label="Total a Entregar" value={formatValue(dailyTotals.amountToRemit)}
          />
        </View>
        <View style={summaryStyles.secondaryMetricsRow}>
          <SecondaryMetric icon={FileText} label="Total Vendido" value={formatValue(dailyTotals.totalCollected)} />
          <SecondaryMetric icon={TrendingUp} label="Premios Pagados" value={formatValue(dailyTotals.premiumsPaid)} />
        </View>
      </View>
    </Card>
  );
};