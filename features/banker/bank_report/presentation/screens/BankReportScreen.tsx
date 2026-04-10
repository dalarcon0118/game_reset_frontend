import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@ui-kitten/components';
import { bankReportApi, BankReport, BankReportFilters } from '../../api/bank_report_api';
import { KpiCard, FilterBar, OperationsTable, HierarchyView } from '../components';
import { COLORS } from '@shared/components/constants';

interface BankReportScreenProps {
  structureId: number;
}

const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const BankReportScreen: React.FC<BankReportScreenProps> = ({ structureId }) => {
  const [report, setReport] = useState<BankReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BankReportFilters>({ period_type: 'all' });

  const fetchReport = useCallback(async (currentFilters: BankReportFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankReportApi.getReport(structureId, currentFilters);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [structureId]);

  useEffect(() => {
    fetchReport(filters);
  }, [fetchReport, filters]);

  const handleFilterChange = useCallback((newFilters: BankReportFilters) => {
    setFilters(newFilters);
  }, []);

  if (loading && !report) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  if (error && !report) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error de Diagnóstico</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.bankName}>🏢 {report.bank_name}</Text>
        <View style={styles.headerBadge}>
          {report.is_filtered ? (
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>{report.period_label}</Text>
            </View>
          ) : (
            <Text style={styles.headerSubtitle}>
              Reporte Mensual • Finalizado
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.pageTitle}>Diagnóstico de Rentabilidad</Text>
      <Text style={styles.pageDescription}>
        Esta sección presenta una visión global de la salud financiera de {report.bank_name} durante el periodo.
        {parseFloat(report.profit_margin) === 0 ? (
          ` Se observa una rentabilidad anómala y altamente positiva del ${report.profit_margin}%, sin registro de gastos operativos ni premios pagados.`
        ) : (
          ` El banco presenta un margen de utilidad del ${report.profit_margin}% con un nivel de siniestralidad (premios) controlado del ${report.payout_ratio}%.`
        )}
      </Text>

      <FilterBar
        periodType={report.period_type as 'all' | 'daily' | 'monthly'}
        dateFilter={report.date_filter}
        monthFilter={report.month_filter}
        yearFilter={report.year_filter}
        monthsList={report.months_list}
        yearsList={report.years_list}
        periodLabel={report.period_label}
        isFiltered={report.is_filtered}
        onFilterChange={handleFilterChange}
      />

      <View style={styles.kpiRow}>
        <View style={styles.kpiItem}>
          <KpiCard
            label="Resultado Neto (Profit)"
            value={formatCurrency(report.summary.net_profit)}
            variant="green"
            footer={
              <>
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeGreenText}>{parseFloat(report.profit_margin).toFixed(0)}% Margen</Text>
                </View>
                <Text style={styles.footerText}>Recaudación total</Text>
              </>
            }
          />
        </View>
        <View style={styles.kpiItem}>
          <KpiCard
            label="Siniestralidad (Premios)"
            value={`${report.payout_ratio}%`}
            footer={
              <>
                <View style={styles.miniBox}>
                  <Text style={styles.miniBoxText}>{formatCurrency(report.summary.total_payout)} Pagados</Text>
                </View>
                <Text style={styles.footerText}>
                  {parseFloat(report.payout_ratio) === 0 ? 'Riesgo materializado nulo' : 'Riesgo bajo control'}
                </Text>
              </>
            }
          />
        </View>
        <View style={styles.kpiItem}>
          <KpiCard
            label="Ticket Promedio"
            value={formatCurrency(report.avg_ticket)}
            variant="blue"
            footer={
              <>
                <View style={styles.badgeBlue}>
                  <Text style={styles.badgeBlueText}>Por Apuesta</Text>
                </View>
                <Text style={styles.footerText}>Nicho de alto valor</Text>
              </>
            }
          />
        </View>
      </View>

      <OperationsTable performance={report.performance} />

      <HierarchyView hierarchy={report.hierarchy} />

      <View style={styles.footer}>
        <Text style={styles.footerCopyright}>
          © 2026 Game Reset Technology | Financial Reporting Unit
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  header: {
    marginBottom: 16,
  },
  bankName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  periodBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodBadgeText: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 13,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  pageDescription: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 900,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  kpiItem: {
    flex: 1,
  },
  badgeGreen: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGreenText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
  badgeBlue: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeBlueText: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 12,
  },
  miniBox: {
    backgroundColor: '#F0F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniBoxText: {
    fontWeight: '700',
    fontSize: 12,
    color: COLORS.textDark,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 13,
    color: COLORS.textLight,
  },
});