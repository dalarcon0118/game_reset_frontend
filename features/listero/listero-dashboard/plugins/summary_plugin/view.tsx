import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card, Button } from '@ui-kitten/components';
import { Eye, EyeOff, PiggyBank, Wallet, FileText, TrendingUp } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { GET_FINANCIAL_BETS, TOGGLE_BALANCE_VISIBILITY, Msg } from './msg';
import { SummaryModule } from './store';
import { RemoteData } from '@core/tea-utils';
import { formatCurrency } from '@/shared/utils/formatters';
import { styles } from './styles';
import { Model } from './model';
import { DailySummarySkeleton } from '@/shared/components/moti_skeleton';

const ErrorView = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <View style={styles.centered}>
    <Text style={styles.error}>Error: {message}</Text>
    {onRetry && (
      <Button size="small" status="danger" onPress={onRetry} style={{ marginTop: 8 }}>
        Reintentar
      </Button>
    )}
  </View>
);

const LoadingView = () => <DailySummarySkeleton loading={true} />;

const MainMetricCard = ({ icon: Icon, color, bg, label, value, valueColor, badgeText }: any) => (
  <View style={styles.mainMetricCard}>
    <View style={styles.mainMetricTopRow}>
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      {badgeText && (
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>{badgeText}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.metricValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

const SecondaryMetric = ({ icon: Icon, label, value, valueColor, badgeText }: any) => (
  <View style={styles.secondaryItem}>
    <View style={styles.secondaryHeader}>
      <Icon size={14} color="#8F9BB3" />
      <Text style={styles.secondaryLabel} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      {badgeText && (
        <View style={styles.secondaryBadge}>
          <Text style={styles.secondaryBadgeText}>{badgeText}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.secondaryValue, valueColor && { color: valueColor }]} numberOfLines={1}>{value}</Text>
  </View>
);

const DashboardContent = ({ model, dispatch }: { model: Model; dispatch: (msg: Msg) => void }) => {
  const { dailyTotals, showBalance, commissionRate } = model;
  const hide = (val: number) => showBalance ? formatCurrency(val) : '****';
  const toggleVisibility = () => dispatch(TOGGLE_BALANCE_VISIBILITY());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumen del Día</Text>
        <TouchableOpacity onPress={toggleVisibility} style={styles.eyeIcon}>
          {showBalance ? <EyeOff size={22} color="#8F9BB3" /> : <Eye size={22} color="#8F9BB3" />}
        </TouchableOpacity>
      </View>

      <View style={styles.mainMetricsContainer}>
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

      <View style={styles.secondaryMetricsRow}>
        <SecondaryMetric icon={FileText} label="Total Vendido" value={hide(dailyTotals.totalCollected)} />
        <SecondaryMetric icon={TrendingUp} label="Premios Pagados" value={hide(dailyTotals.premiumsPaid)} valueColor="#FF3D71" />
      </View>
    </View>
  );
};

export const SummaryComponent: React.FC = () => {
  // 🛡️ MEJORA: Un solo hook para el store completo (como WinnersScreen)
  const { model, dispatch } = SummaryModule.useStore();

  const reload = () => dispatch(GET_FINANCIAL_BETS());

  if (model.contextError) {
    return (
      <Card style={styles.card}>
        <ErrorView message={`Plugin Error: ${model.contextError}`} />
      </Card>
    );
  }

  if (!model.context) {
    return <LoadingView />;
  }

  const state = model.financialSummary || RemoteData.notAsked();

  return match(state)
    .with({ type: 'NotAsked' }, () => <LoadingView />)
    .with({ type: 'Loading' }, () => <LoadingView />)
    .with({ type: 'Failure' }, ({ error }) => (
      <Card style={styles.card}>
        <ErrorView message={String(error)} onRetry={reload} />
      </Card>
    ))
    .with({ type: 'Success' }, () => (
      <Card style={styles.card}>
        <DashboardContent model={model} dispatch={dispatch} />
      </Card>
    ))
    .exhaustive();
};
