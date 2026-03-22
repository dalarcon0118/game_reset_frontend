import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Spinner, Divider } from '@ui-kitten/components';
import { DollarSign, Ticket, Clock, TrendingUp } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { WebData } from '@core/tea-utils';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';
import LayoutConstants from '@/constants/layout';
import { GroupedReceipt, selectGroupedWinnings } from '../../core/selectors';

/**
 * Helper para extraer el número jugado de una apuesta
 * La API puede devolver string o objeto {numbers: string[]}
 */
const extractNumberPlayed = (bet: WinningBet): string => {
  const numbersPlayed = bet.numbers_played as unknown;
  
  if (typeof numbersPlayed === 'string') {
    return numbersPlayed;
  }
  // Objeto con formato {numbers: ["1234"]}
  const obj = numbersPlayed as { numbers?: string[] };
  return obj?.numbers?.[0] || 'N/A';
};

interface WinningsSectionProps {
  status: WebData<WinningBet[]>;
}

/**
 * 🎫 TICKET GROUP VIEW
 * Renderiza un recibo agrupado con sus apuestas ganadoras.
 */
const ReceiptTicket: React.FC<{ receipt: GroupedReceipt; index: number }> = ({ receipt, index }) => (
  <Card style={styles.receiptCard} status="success" testID={`receipt-card-${index}`}>
    <View style={styles.receiptHeader} testID={`receipt-header-${index}`}>
      <View style={styles.receiptMeta}>
        <Ticket size={16} color="#8F9BB3" />
        <Text category="c1" appearance="hint" style={styles.receiptCode} testID={`receipt-code-${index}`}>
          #{receipt.receiptCode}
        </Text>
      </View>
      <View style={styles.receiptMeta}>
        <Clock size={14} color="#8F9BB3" />
        <Text category="c1" appearance="hint" testID={`receipt-timestamp-${index}`}>
          {new Date(receipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>

    <Divider style={styles.divider} />

    {receipt.bets.map((bet, betIndex) => (
      <View key={bet.id} style={styles.betRow} testID={`bet-row-${index}-${betIndex}`}>
        <View style={styles.betMainInfo}>
          <Text category="s1" style={styles.betNumbers} testID={`bet-numbers-${index}-${betIndex}`}>{extractNumberPlayed(bet)}</Text>
          <Text category="c1" appearance="hint" style={styles.betType}>
            {bet.bet_type_details?.name || 'Apuesta'}
          </Text>
        </View>
        <View style={styles.betPricing}>
          <Text category="c2" appearance="hint">Jugado: ${Number(bet.amount).toFixed(2)}</Text>
          <Text category="s1" status="success" style={styles.betPayout} testID={`payout-amount-${index}-${betIndex}`}>
            +${Number(bet.payout_amount).toFixed(2)}
          </Text>
        </View>
      </View>
    ))}

    <Divider style={styles.divider} />

    <View style={styles.receiptFooter}>
      <View style={styles.footerStat}>
        <Text category="c2" appearance="hint">Total Ticket</Text>
        <Text category="h6" status="success" style={styles.footerAmount}>
          ${receipt.totalPayout.toFixed(2)}
        </Text>
      </View>
      <View style={styles.footerBadge}>
        <TrendingUp size={14} color="#00E096" />
        <Text category="c2" status="success" style={styles.roiText}>
          Ganador
        </Text>
      </View>
    </View>
  </Card>
);

/**
 * 💰 USER WINNINGS SECTION
 * Maneja el estado de las apuestas ganadoras agrupadas por recibo.
 */
export const UserWinningsSection: React.FC<WinningsSectionProps> = ({ status }) => {
  return match(status)
    .with({ type: 'Success' }, ({ data: winningBets }) => {
      const groupedWinnings = selectGroupedWinnings(winningBets);

      if (groupedWinnings.length === 0) {
        return (
          <View style={styles.emptyContainer} testID="winnings-empty-state">
            <Text appearance="hint" category="s1" testID="winnings-empty-text">No tienes premios en este sorteo</Text>
            <Text appearance="hint" category="c1" style={styles.emptySub}>¡Sigue intentando en el próximo!</Text>
          </View>
        );
      }

      const totalGeneral = groupedWinnings.reduce((sum, g) => sum + g.totalPayout, 0);

      return (
        <View style={styles.winningsSection}>
          <View style={styles.winningsHeader} testID="winnings-header">
            <DollarSign size={24} color="#00D68F" />
            <Text category="h6" style={styles.winningsTitle} testID="winnings-title">TUS PREMIOS</Text>
          </View>
          
          <Card style={styles.totalSummaryCard}>
            <View style={styles.summaryContent}>
              <Text category="c2" appearance="hint">Total General Ganado</Text>
              <Text category="h2" style={styles.totalAmount} testID="total-payout">
                ${totalGeneral.toFixed(2)}
              </Text>
            </View>
          </Card>

          {groupedWinnings.map((receipt, idx) => (
            <ReceiptTicket key={receipt.receiptCode} receipt={receipt} index={idx} />
          ))}
        </View>
      );
    })
    .with({ type: 'Loading' }, () => (
      <View style={styles.loadingContainer} testID="winnings-loading-state">
        <Spinner size="small" testID="winnings-spinner" />
        <Text appearance="hint" style={styles.loadingText}>Calculando tus premios...</Text>
      </View>
    ))
    .with({ type: 'Failure' }, ({ error }) => (
      <View style={styles.errorContainer} testID="winnings-error-state">
        <Text appearance="hint" status="danger" testID="winnings-error-text">
          {typeof error === 'string' ? error : 'Error al cargar tus premios'}
        </Text>
      </View>
    ))
    .otherwise(() => null);
};

const styles = StyleSheet.create({
  winningsSection: {
    marginTop: LayoutConstants.spacing.md,
  },
  winningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: LayoutConstants.spacing.md,
  },
  winningsTitle: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  totalSummaryCard: {
    backgroundColor: '#F0FFF4',
    borderColor: '#00D68F',
    marginBottom: LayoutConstants.spacing.lg,
    borderRadius: LayoutConstants.borderRadius.md,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalAmount: {
    color: '#00D68F',
    fontWeight: '900',
  },
  receiptCard: {
    marginBottom: LayoutConstants.spacing.md,
    borderRadius: LayoutConstants.borderRadius.md,
    borderLeftWidth: 4, // Acento visual de éxito
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptCode: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#EDF1F7',
  },
  betRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  betMainInfo: {
    flex: 1,
  },
  betNumbers: {
    fontWeight: '700',
    fontSize: 16,
  },
  betType: {
    textTransform: 'uppercase',
    fontSize: 10,
    marginTop: 2,
  },
  betPricing: {
    alignItems: 'flex-end',
  },
  betPayout: {
    fontWeight: '800',
    fontSize: 16,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  footerStat: {
    flex: 1,
  },
  footerAmount: {
    fontWeight: '900',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3FFF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roiText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F7F9FC',
    borderRadius: LayoutConstants.borderRadius.md,
    marginTop: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#C5CEE0',
  },
  emptySub: {
    marginTop: 4,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
