import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Label, Card, Flex } from '../../../../shared/components';
import { Wallet, TrendingUp, PiggyBank, ReceiptText } from 'lucide-react-native';

interface GlobalSummaryProps {
  totals: {
    totalCollected: number;
    premiumsPaid: number;
    netResult: number;
    estimatedCommission: number;
    amountToRemit: number;
  };
  commissionRate: number;
}

export default function GlobalSummary({ totals, commissionRate }: GlobalSummaryProps) {
  const {
    estimatedCommission = 0,
    totalCollected = 0,
    premiumsPaid = 0,
    netResult = 0,
    amountToRemit = 0
  } = totals || {};

  return (
    <View style={styles.container}>
      <Label style={styles.sectionTitle}>Resumen del Día</Label>
      <Card style={styles.mainCard}>
        <Flex vertical gap={16}>
          {/* Top row: Commission (The most important for Listero) */}
          <Flex align="center" justify="between" style={styles.commissionRow}>
            <Flex align="center" gap={12}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FFF8' }]}>
                <PiggyBank size={24} color="#00C48C" />
              </View>
              <View>
                <Label type="detail">Mi Ganancia Est.</Label>
                <Label style={styles.commissionValue}>${estimatedCommission.toFixed(2)}</Label>
              </View>
            </Flex>
            <View style={styles.badge}>
              <Label style={styles.badgeText}>{(commissionRate * 100).toFixed(0)}%</Label>
            </View>
          </Flex>

          {/* Amount to Remit (To Collector) */}
          <Flex align="center" justify="between" style={styles.remitRow}>
            <Flex align="center" gap={12}>
              <View style={[styles.iconBox, { backgroundColor: '#F4F6FF' }]}>
                <Wallet size={24} color="#3366FF" />
              </View>
              <View>
                <Label type="detail">Monto a Entregar al Colector</Label>
                <Label style={styles.remitValue}>${amountToRemit.toFixed(2)}</Label>
              </View>
            </Flex>
          </Flex>

          <View style={styles.divider} />

          {/* Bottom Grid: Sales and Payouts */}
          <Flex justify="between">
            <View style={styles.statItem}>
              <Flex align="center" gap={8} margin={{ type: 'bottom', value: 4 }}>
                <ReceiptText size={16} color="#8F9BB3" />
                <Label type="detail">Ventas Totales</Label>
              </Flex>
              <Label style={styles.statValue}>${totalCollected.toFixed(2)}</Label>
            </View>

            <View style={styles.statItem}>
              <Flex align="center" gap={8} margin={{ type: 'bottom', value: 4 }}>
                <TrendingUp size={16} color="#8F9BB3" />
                <Label type="detail">Premios</Label>
              </Flex>
              <Label style={[styles.statValue, { color: '#FF3D71' }]}>${premiumsPaid.toFixed(2)}</Label>
            </View>

            <View style={styles.statItem}>
              <Flex align="center" gap={8} margin={{ type: 'bottom', value: 4 }}>
                <Wallet size={16} color="#8F9BB3" />
                <Label type="detail">Balance</Label>
              </Flex>
              <Label style={[styles.statValue, { color: netResult >= 0 ? '#00C48C' : '#FF3D71' }]}>
                ${netResult.toFixed(2)}
              </Label>
            </View>
          </Flex>
        </Flex>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2E3A59',
  },
  mainCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  commissionRow: {
    width: '100%',
  },
  iconBox: {
    padding: 10,
    borderRadius: 12,
  },
  commissionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3A59',
  },
  remitRow: {
    paddingTop: 4,
  },
  remitValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3366FF',
  },
  badge: {
    backgroundColor: '#E6F9F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#00C48C',
    fontWeight: 'bold',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    width: '100%',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E3A59',
  },
});
