import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Button } from '@ui-kitten/components';
import { Eye, EyeOff, PiggyBank, Wallet, FileText, TrendingUp, BarChart3 } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { GET_FINANCIAL_BETS, TOGGLE_BALANCE_VISIBILITY } from './msg';
import { SummaryModule, selectModel, selectDispatch } from './store';
import { RemoteData } from '@core/tea-utils';
import { formatCurrency } from '@/shared/utils/formatters';
import { styles } from './styles';
import { Model, DailyTotals } from './model';

// ============================================================================
// PURE COMPONENTS (Views as Functions: Props -> UI)
// ============================================================================

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

const LoadingView = ({ text }: { text: string }) => (
  <View style={styles.centered}>
    <ActivityIndicator size="small" color="#3366FF" />
    <Text style={[styles.metricLabel, { marginTop: 12 }]}>{text}</Text>
  </View>
);

const EmptyView = ({ onReload }: { onReload: () => void }) => (
  <View style={styles.centered}>
    <Text style={styles.metricLabel}>Datos no cargados</Text>
    <Button size="small" style={{ marginTop: 8 }} onPress={onReload}>
      Cargar datos
    </Button>
  </View>
);

const MetricRow = ({ icon: Icon, color, bg, label, value, valueColor = undefined }: any) => (
  <View style={styles.mainMetricRow}>
    <View style={[styles.iconContainer, { backgroundColor: bg }]}>
      <Icon size={24} color={color} />
    </View>
    <View style={styles.metricInfo}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);

const SecondaryMetric = ({ icon: Icon, label, value, valueColor = undefined }: any) => (
  <View style={styles.secondaryItem}>
    <View style={styles.secondaryHeader}>
      <Icon size={16} color="#8F9BB3" style={{ marginRight: 4 }} />
      <Text style={styles.secondaryLabel}>{label}</Text>
    </View>
    <Text style={[styles.secondaryValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

const DashboardContent = ({ model, dispatch }: { model: Model; dispatch: any }) => {
  const { dailyTotals, showBalance, commissionRate } = model;
  const hide = (val: number) => showBalance ? formatCurrency(val) : '****';
  const toggleVisibility = () => dispatch(TOGGLE_BALANCE_VISIBILITY());
  useEffect(() => {
    console.log('-----Render SummaryComponent mounted---');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumen del Día</Text>
        <TouchableOpacity onPress={toggleVisibility} style={styles.eyeIcon}>
          {showBalance ? <EyeOff size={22} color="#8F9BB3" /> : <Eye size={22} color="#8F9BB3" />}
        </TouchableOpacity>
      </View>

      <View style={styles.mainMetricsContainer}>
        <MetricRow 
          icon={PiggyBank} color="#00D68F" bg="#E8FBF4" 
          label="Ganancia Estimada" value={hide(dailyTotals.estimatedCommission)} 
        />
        <View style={styles.divider} />
        <MetricRow 
          icon={Wallet} color="#3366FF" bg="#F0F5FF" 
          label="Total a Rendir" value={hide(dailyTotals.amountToRemit)} valueColor="#3366FF" 
        />
      </View>

      <View style={styles.secondaryMetricsRow}>
        <SecondaryMetric icon={FileText} label="Recolectado" value={hide(dailyTotals.totalCollected)} />
        <SecondaryMetric icon={TrendingUp} label="Premios" value={hide(dailyTotals.premiumsPaid)} valueColor="#FF3D71" />
        <SecondaryMetric icon={BarChart3} label={`Comisión (${Math.round(commissionRate * 100)}%)`} value={hide(dailyTotals.estimatedCommission)} />
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT (State & Orchestration)
// ============================================================================

export const SummaryComponent: React.FC = () => {
  const model = SummaryModule.useStore(selectModel);
  const dispatch = SummaryModule.useStore(selectDispatch);
  const reload = () => dispatch(GET_FINANCIAL_BETS());
  useEffect(() => {
    console.log('-----Render SummaryComponent mounted---');
  }, []);
  const renderContent = () => {
    // Pipeline Declarativo: Evaluamos el contexto y luego el RemoteData
    if (model.contextError) return <ErrorView message={`Plugin Error: ${model.contextError}`} />;
    if (!model.context) return <LoadingView text="Inicializando..." />;

    const state = model.financialSummary || RemoteData.notAsked();

    return match(state)
      .with({ type: 'NotAsked' }, () => <EmptyView onReload={reload} />)
      .with({ type: 'Loading' }, () => <LoadingView text="Cargando resumen..." />)
      .with({ type: 'Failure' }, ({ error }) => <ErrorView message={String(error)} onRetry={reload} />)
      .with({ type: 'Success' }, () => <DashboardContent model={model} dispatch={dispatch} />)
      .exhaustive();
  };

  return (
    <Card style={styles.card}>
      {renderContent()}
    </Card>
  );
};
