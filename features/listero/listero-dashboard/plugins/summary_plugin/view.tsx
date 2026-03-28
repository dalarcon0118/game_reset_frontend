import React from 'react';

import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Button } from '@ui-kitten/components';
import { Eye, EyeOff, PiggyBank, Wallet, FileText, TrendingUp, BarChart3 } from 'lucide-react-native';
import { GET_FINANCIAL_BETS, TOGGLE_BALANCE_VISIBILITY } from './msg';
import { SummaryModule, selectModel, selectDispatch } from './store';
import { RemoteData } from '@core/tea-utils';
import { formatCurrency } from '@/shared/utils/formatters';
import { styles } from './styles';
import logger from '@/shared/utils/logger';

export const SummaryComponent: React.FC = () => {
  const log = logger.withTag('SummaryComponent');
  const model = SummaryModule.useStore(selectModel);
  const dispatch = SummaryModule.useStore(selectDispatch);

  // Si hay un error en el contexto, mostrarlo
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
    // Protección adicional contra modelo no inicializado
    const financialSummary = model?.financialSummary || RemoteData.notAsked();
    
    return RemoteData.fold({
      notAsked: () => (
        <View style={styles.centered}>
          <Text style={styles.metricLabel}>Datos no cargados</Text>
          <Button 
            size="small" 
            style={{ marginTop: 8 }}
            onPress={() => dispatch(GET_FINANCIAL_BETS())}
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
            onPress={() => dispatch(GET_FINANCIAL_BETS())}
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
                  <Text style={styles.metricLabel}>Ganancia Estimada</Text>
                  <Text style={styles.metricValue}>
                    {showBalance ? formatCurrency(dailyTotals.estimatedCommission) : '****'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Total a Rendir */}
              <View style={styles.mainMetricRow}>
                <View style={[styles.iconContainer, { backgroundColor: '#F0F5FF' }]}>
                  <Wallet size={24} color="#3366FF" />
                </View>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>Total a Rendir</Text>
                  <Text style={[styles.metricValue, { color: '#3366FF' }]}>
                    {showBalance ? formatCurrency(dailyTotals.amountToRemit) : '****'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Secondary Metrics */}
            <View style={styles.secondaryMetricsRow}>
              <View style={styles.secondaryItem}>
                <View style={styles.secondaryHeader}>
                  <FileText size={16} color="#8F9BB3" style={{ marginRight: 4 }} />
                  <Text style={styles.secondaryLabel}>Recolectado</Text>
                </View>
                <Text style={styles.secondaryValue}>
                  {showBalance ? formatCurrency(dailyTotals.totalCollected) : '****'}
                </Text>
              </View>

              <View style={styles.secondaryItem}>
                <View style={styles.secondaryHeader}>
                  <TrendingUp size={16} color="#8F9BB3" style={{ marginRight: 4 }} />
                  <Text style={styles.secondaryLabel}>Premios</Text>
                </View>
                <Text style={[styles.secondaryValue, { color: '#FF3D71' }]}>
                  {showBalance ? formatCurrency(dailyTotals.premiumsPaid) : '****'}
                </Text>
              </View>

              <View style={styles.secondaryItem}>
                <View style={styles.secondaryHeader}>
                  <BarChart3 size={16} color="#8F9BB3" style={{ marginRight: 4 }} />
                  <Text style={styles.secondaryLabel}>Comisión ({Math.round((model.commissionRate || 0) * 100)}%)</Text>
                </View>
                <Text style={styles.secondaryValue}>
                  {showBalance ? formatCurrency(dailyTotals.estimatedCommission) : '****'}
                </Text>
              </View>
            </View>
          </View>
        );
      }
    }, financialSummary);
  };

  return (
    <Card style={styles.card}>
      {renderContent()}
    </Card>
  );
};
