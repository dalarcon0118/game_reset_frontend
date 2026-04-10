import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@shared/components/card';
import { COLORS } from '@shared/components/constants';
import { BankReportFilters } from '../../api/bank_report_api';

interface FilterBarProps {
  periodType: 'all' | 'daily' | 'monthly';
  dateFilter: string;
  monthFilter: string;
  yearFilter: string;
  monthsList: [number, string][];
  yearsList: [number, string][];
  periodLabel: string;
  isFiltered: boolean;
  onFilterChange: (filters: BankReportFilters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  periodType,
  dateFilter,
  monthFilter,
  yearFilter,
  monthsList,
  yearsList,
  periodLabel,
  isFiltered,
  onFilterChange,
}) => {
  const [localPeriodType, setLocalPeriodType] = useState(periodType);
  const [localDate, setLocalDate] = useState(dateFilter);
  const [localMonth, setLocalMonth] = useState(monthFilter);
  const [localYear, setLocalYear] = useState(yearFilter);

  const handleToggle = (mode: 'all' | 'daily' | 'monthly') => {
    setLocalPeriodType(mode);
    if (mode === 'all') {
      onFilterChange({ period_type: 'all' });
    } else {
      onFilterChange({
        period_type: mode,
        date: mode === 'daily' ? localDate : undefined,
        month: mode === 'monthly' ? localMonth : undefined,
        year: mode === 'monthly' ? localYear : undefined,
      });
    }
  };

  const handleApply = () => {
    onFilterChange({
      period_type: localPeriodType,
      date: localPeriodType === 'daily' ? localDate : undefined,
      month: localPeriodType === 'monthly' ? localMonth : undefined,
      year: localPeriodType === 'monthly' ? localYear : undefined,
    });
  };

  return (
    <Card style={styles.container} padding={20}>
      <View style={styles.toggleRow}>
        <View style={styles.btnGroup}>
          {(['all', 'daily', 'monthly'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, localPeriodType === mode && styles.toggleBtnActive]}
              onPress={() => handleToggle(mode)}
            >
              <Text
                style={[styles.toggleText, localPeriodType === mode && styles.toggleTextActive]}
              >
                {mode === 'all' ? '🔄 Todo' : mode === 'daily' ? '📅 Diario' : '📆 Mensual'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {isFiltered && (
          <View style={styles.filterIndicator}>
            <Text style={styles.filterIndicatorText}>🔔 {periodLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.filterControls}>
        {localPeriodType === 'daily' && (
          <View style={styles.dateInput}>
            <Text style={styles.inputLabel}>Fecha:</Text>
            <TouchableOpacity style={styles.dateButton}>
              <Text>{localDate || 'Seleccionar fecha'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {localPeriodType === 'monthly' && (
          <View style={styles.monthYearRow}>
            <View style={styles.selectWrapper}>
              <Text style={styles.inputLabel}>Mes:</Text>
              <TouchableOpacity style={styles.selectButton}>
                <Text>
                  {monthsList.find((m) => m[0] === Number(localMonth))?.[1] || 'Seleccionar'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.selectWrapper}>
              <Text style={styles.inputLabel}>Año:</Text>
              <TouchableOpacity style={styles.selectButton}>
                <Text>{localYear || 'Seleccionar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {localPeriodType !== 'all' && (
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Aplicar</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    fontWeight: '600',
    color: COLORS.textLight,
  },
  toggleTextActive: {
    color: COLORS.cardBg,
  },
  filterIndicator: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  filterIndicatorText: {
    color: '#E65100',
    fontWeight: '700',
    fontSize: 13,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontWeight: '600',
    color: COLORS.textLight,
    fontSize: 13,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  monthYearRow: {
    flexDirection: 'row',
    gap: 16,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  applyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.success,
  },
  applyBtnText: {
    color: COLORS.cardBg,
    fontWeight: '700',
  },
});