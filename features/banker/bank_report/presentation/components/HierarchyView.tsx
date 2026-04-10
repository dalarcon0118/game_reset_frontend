import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@shared/components/card';
import { COLORS } from '@shared/components/constants';
import { Hierarchy } from '../../api/bank_report_api';

interface HierarchyViewProps {
  hierarchy: Hierarchy;
}

const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface NodeBoxProps {
  title: string;
  subtitle: string;
  value: string;
  borderColor: string;
  textColor: string;
}

const NodeBox: React.FC<NodeBoxProps> = ({ title, subtitle, value, borderColor, textColor }) => (
  <View style={[styles.hBox, { borderColor }]}>
    <Text style={[styles.hBoxTitle, { color: textColor }]}>{title}</Text>
    <Text style={styles.hBoxDetail}>{subtitle}</Text>
    <Text style={[styles.hBoxValue, { color: textColor }]}>{value}</Text>
  </View>
);

export const HierarchyView: React.FC<HierarchyViewProps> = ({ hierarchy }) => {
  const topNames = hierarchy.top.map((p) => p.name).join(', ') || 'Ninguno';
  const midNames = hierarchy.mid.map((p) => p.name).join(', ') || 'Ninguno';
  const lowNames = hierarchy.low.map((p) => p.name).join(', ') || 'Ninguno';
  const inactiveNames = hierarchy.inactive.map((p) => p.name).join(', ') || 'Ninguno';

  return (
    <Card style={styles.container} padding={48}>
      <Text style={styles.title}>Estructura de Red</Text>

      <View style={styles.hierarchyTree}>
        <View style={[styles.hNode, { borderColor: COLORS.success }]}>
          <Text style={styles.hNodeTitle}>Banquero Principal</Text>
          <Text style={styles.hNodeSub}>Administración</Text>
        </View>

        <View style={styles.verticalLine} />

        <View style={[styles.hNode, { borderColor: COLORS.success }]}>
          <Text style={styles.hNodeTitle}>Colector Único</Text>
          <Text style={styles.hNodeSub}>Ruta de recolección saturada</Text>
        </View>

        <View style={styles.horizontalLine} />

        <View style={styles.hRow}>
          <NodeBox
            title="Listerías Top"
            subtitle={topNames}
            value={formatCurrency(hierarchy.top_total)}
            borderColor={COLORS.success}
            textColor={COLORS.success}
          />
          <NodeBox
            title="Listería Media"
            subtitle={midNames}
            value={formatCurrency(hierarchy.mid_total)}
            borderColor={COLORS.primary}
            textColor={COLORS.primary}
          />
          <NodeBox
            title="Listerías Bajas"
            subtitle={lowNames}
            value={formatCurrency(hierarchy.low_total)}
            borderColor={COLORS.warning}
            textColor={COLORS.warning}
          />
          <NodeBox
            title={`Bloque Inactivo (${hierarchy.inactive.length} Nodos)`}
            subtitle={inactiveNames || 'Ninguno'}
            value="$0.00 Recaudado"
            borderColor={COLORS.danger}
            textColor={COLORS.danger}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 32,
    textAlign: 'left',
  },
  hierarchyTree: {
    alignItems: 'center',
  },
  hNode: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 220,
    alignItems: 'center',
    marginBottom: 40,
  },
  hNodeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  hNodeSub: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  verticalLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.border,
    marginVertical: -40,
  },
  horizontalLine: {
    width: '80%',
    height: 2,
    backgroundColor: COLORS.border,
    marginVertical: 0,
  },
  hRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  hBox: {
    flex: 1,
    minWidth: 180,
    maxWidth: 240,
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  hBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  hBoxDetail: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  hBoxValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});