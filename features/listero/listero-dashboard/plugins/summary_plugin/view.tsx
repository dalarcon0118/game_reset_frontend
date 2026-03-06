import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Button } from '@ui-kitten/components';
import { Eye, EyeOff, PiggyBank, Wallet, FileText, TrendingUp, BarChart3 } from 'lucide-react-native';
import { INIT_CONTEXT, FETCH_FINANCIAL_SUMMARY, TOGGLE_BALANCE_VISIBILITY } from './msg';
import { useSummaryPluginStore } from './store';
import { RemoteData } from '@/shared/core/tea-utils';
import { formatCurrency } from '@/shared/utils/formatters';
import { styles } from './styles';
import { SummaryPluginContext } from './domain/services';

interface SummaryComponentProps {
  context: SummaryPluginContext;
}

export const SummaryComponent: React.FC<SummaryComponentProps> = ({ context }) => {
  const { model, dispatch } = useSummaryPluginStore();

  // Inicializar el contexto solo una vez al montar el componente
  React.useEffect(() => {
    const shouldInit = context && (!model.context || model.context?.hostStore !== context.hostStore);
    if (shouldInit) {
      dispatch(INIT_CONTEXT(context));
    }
  }, [context, dispatch]); // Removed model.context from dependencies

  if (model.contextError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Plugin Error: {model.contextError}
        </Text>
      </View>
    );
  }

  // Si no hay contexto aún, mostrar un indicador de carga
  if (!model.context) {
    return (
      <Card style={styles.card}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#3366FF" />
          <Text style={[styles.metricLabel, { marginTop: 12 }]}>Inicializando...</Text>
        </View>
      </Card>
    );
  }

  const handleToggleBalance = () => {
    dispatch(TOGGLE_BALANCE_VISIBILITY());
  };

  const renderContent = () => {
    return RemoteData.fold({
      notAsked: () => (
        <View style={styles.centered}>
          <Text style={styles.metricLabel}>Datos no cargados</Text>
          <Button 
            size="small" 
            style={{ marginTop: 8 }}
            onPress={() => dispatch(FETCH_FINANCIAL_SUMMARY())}
          >
            Cargar datos
          </Button>
        </View>
      ),
      loading: () => (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#3366FF" />
          <Text style={[styles.metricLabel, { marginTop: 12 }]}>Cargando resumen...</Text>
        </View>
      ),
      failure: (error) => (
        <View style={styles.centered}>
          <Text style={styles.error}>Error: {String(error)}</Text>
          <Button 
            size="small"
            status="danger"
            onPress={() => dispatch(FETCH_FINANCIAL_SUMMARY())}
          >
            Reintentar
          </Button>
        </View>
      ),
      success: () => {
        const { dailyTotals, showBalance, commissionRate } = model;
        
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Resumen del Día</Text>
              <TouchableOpacity onPress={handleToggleBalance} style={styles.eyeIcon}>
                {showBalance ? (
                  <EyeOff size={22} color="#8F9BB3" />
                ) : (
                  <Eye size={22} color="#8F9BB3" />
                )}
              </TouchableOpacity>
            </View>

            {/* Main Metrics */}
            <View style={styles.mainMetricsContainer}>
              {/* Ganancia Estimada */}
              <View style={styles.mainMetricRow}>
                <View style={[styles.iconContainer, { backgroundColor: '#E8FBF4' }]}>
                  <PiggyBank size={24} color="#00D68F" />
                </View>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>Mi Ganancia Est.</Text>
                  <Text style={styles.metricValue}>
                    {showBalance ? formatCurrency(dailyTotals.estimatedCommission) : '****'}
                  </Text>
                </View>
                <View style={styles.percentageBadge}>
                  <Text style={styles.percentageText}>{Math.round(commissionRate * 100)}%</Text>
                </View>
              </View>

              {/* Monto a Entregar */}
              <View style={styles.mainMetricRow}>
                <View style={[styles.iconContainer, { backgroundColor: '#EBF1FF' }]}>
                  <Wallet size={24} color="#3366FF" />
                </View>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>Monto a Entregar al Colector</Text>
                  <Text style={[styles.metricValue, styles.primaryText]}>
                    {showBalance ? formatCurrency(dailyTotals.amountToRemit) : '****'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Secondary Metrics */}
            <View style={styles.secondaryMetricsRow}>
              {/* Ventas */}
              <View style={styles.secondaryItem}>
                <View style={styles.secondaryHeader}>
                  <FileText size={14} color="#8F9BB3" />
                  <Text style={styles.secondaryLabel}>Ventas</Text>
                </View>
                <Text style={styles.secondaryValue}>
                  {showBalance ? formatCurrency(dailyTotals.totalCollected) : '****'}
                </Text>
              </View>

              {/* Premios */}
              <View style={styles.secondaryItem}>
                <View style={styles.secondaryHeader}>
                  <TrendingUp size={14} color="#8F9BB3" />
                  <Text style={styles.secondaryLabel}>Premios</Text>
                </View>
                <Text style={[styles.secondaryValue, styles.negativeText]}>
                  {showBalance ? formatCurrency(dailyTotals.premiumsPaid) : '****'}
                </Text>
              </View>

              {/* Balance */}
              <View style={styles.secondaryItem}>
                <View style={styles.secondaryHeader}>
                  <BarChart3 size={14} color="#8F9BB3" />
                  <Text style={styles.secondaryLabel}>Balance</Text>
                </View>
                <Text style={[styles.secondaryValue, styles.positiveText]}>
                  {showBalance ? formatCurrency(dailyTotals.netResult) : '****'}
                </Text>
              </View>
            </View>
          </View>
        );
      }
    }, model.financialSummary);
  };

  return (
    <Card style={styles.card}>
      {renderContent()}
    </Card>
  );
};