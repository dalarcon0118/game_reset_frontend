import React from 'react';
import { StyleSheet, View } from 'react-native';
import { match } from 'ts-pattern';
import { Label, Card, Flex, ButtonKit, Badge } from '@/shared/components';
import { CalendarClock, Clock3, AlarmClock, CloudOff } from 'lucide-react-native';
import { DRAW_STATUS } from '@/types';
import { Draw } from '../core/types';
import { TotalsByDrawIdMap, DrawFinancialTotals } from '../model';
import SummaryCard from './summary_card';

// Props del componente - SSOT: Draw y Totals vienen de fuentes separadas
interface DrawItemProps {
  draw: Draw;
  totalsByDrawId: TotalsByDrawIdMap;
  onRulePress: (id: string | number) => void;
  onRewardsPress: (id: string, title: string) => void;
  onBetsListPress: (id: string, title: string) => void;
  onCreateBetPress: (id: string, title: string) => void;
  showBalance: boolean;
}

export default function DrawItem({
   draw,
   totalsByDrawId,
   onRulePress,
   onRewardsPress,
   onBetsListPress,
   onCreateBetPress,
   showBalance
}: DrawItemProps) {
  
  // SSOT: Obtener totales financieros desde BetRepository (totalsByDrawId)
  const drawId = draw.id.toString();
  const totals: DrawFinancialTotals | undefined = totalsByDrawId.get(drawId);
  
  // Valores financieros - vienen de BetRepository, no mezclados con Draw
  const totalCollected = totals?.totalCollected ?? 0;
  const premiumsPaid = totals?.premiumsPaid ?? 0;
  const netResult = totals?.netResult ?? 0;
  const betCount = totals?.betCount ?? 0;

  const handleRewardsPress = () => {
    onRewardsPress(draw.id.toString(), draw.source || '');
  }

  const handleBetsListPress = () => {
    onBetsListPress(draw.id.toString(), draw.source || '');
  }

  const handleCreateBetPress = () => {
    onCreateBetPress(draw.id.toString(), draw.source || '');
  }

  const getDrawStatus = () => {
    if (draw.is_betting_open === true) return DRAW_STATUS.OPEN;
    
    if (!draw.betting_end_time) return draw.status;
    const now = new Date();
    const endTime = new Date(draw.betting_end_time);
    if (now >= endTime) return DRAW_STATUS.CLOSED;
    return draw.status;
  };

  const effectiveStatus = getDrawStatus();

  const getClosingTimeInfo = () => {
    if (!draw.betting_end_time || effectiveStatus !== DRAW_STATUS.OPEN) return null;
    
    const now = new Date();
    const endTime = new Date(draw.betting_end_time);
    const diffMs = endTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (diffMs > 0 && diffMs < 5 * 60 * 1000) {
      return {
        isCritical: true,
        timeLeft: `${diffMins}:${diffSecs.toString().padStart(2, '0')}`
      };
    }
    return null;
  };

  const closingInfo = getClosingTimeInfo();

  const getStatusBadge = () => {
    return match(effectiveStatus)
      .with(DRAW_STATUS.OPEN, () => (
        <Badge 
          color={closingInfo?.isCritical ? "#FF3D71" : "#00D68F"} 
          textColor="#FFFFFF"
          content={closingInfo?.isCritical ? `Cierra en ${closingInfo.timeLeft}` : "Abierto"}
        />
      ))
      .with(DRAW_STATUS.CLOSED, () => (
        <Badge 
          color="#FF3D71" 
          textColor="#FFFFFF"
          content="Cerrado"
        />
      ))
      .with(DRAW_STATUS.SCHEDULED, DRAW_STATUS.PENDING, () => (
        <Badge 
          color="#8F9BB3" 
          textColor="#FFFFFF"
          content="Programado"
        />
      ))
      .otherwise(() => (
        <Badge 
          color="#8F9BB3" 
          textColor="#FFFFFF"
          content={effectiveStatus === DRAW_STATUS.SCHEDULED ? 'Programado' : effectiveStatus}
        />
      ));
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  };

  const hasOfflineBets = betCount > 0;
  const offlineCount = betCount;

  return (
    <Card style={[styles.container, closingInfo?.isCritical && styles.criticalContainer]}>
      {/* Header with Title and Status */}
      <Flex justify="between" align="start" style={styles.header}>
        <View style={styles.titleContainer}>
          <Flex align="center" gap={8}>
            <Label style={styles.drawTitle}>{draw.source}</Label>
            {/* Indicador de apuestas pendientes desde BetRepository */}
            {hasOfflineBets && (
              <View style={styles.offlineBadge}>
                <CloudOff size={10} color="#fff" />
                <Label style={styles.offlineBadgeText}>{offlineCount}</Label>
              </View>
            )}
          </Flex>
          <Flex align="center" gap={4}>
            <CalendarClock size={12} color="#8F9BB3" />
            <Label type="detail" style={styles.dateText}>{draw.date}</Label>
            <Clock3 size={12} color="#8F9BB3" style={{ marginLeft: 4 }} />
            <Label type="detail" style={styles.dateText}>
              {formatTime(draw.betting_start_time)} - {formatTime(draw.betting_end_time)}
            </Label>
          </Flex>
        </View>
        <Flex align="center" justify="end" gap={8} style={styles.statusWrapper}>
          {getStatusBadge()}
          {closingInfo?.isCritical && (
            <AlarmClock size={20} color="#FF3D71" />
          )}
        </Flex>
      </Flex>

      {/* Financial Row - Compact */}
      {/* SSOT: Los valores vienen de totalsByDrawId (BetRepository), no del Draw */}
      <View style={styles.financialRow}>
        <SummaryCard
          title="Ventas"
          amount={totalCollected}
          type="collected"
          showBalance={showBalance}
          hasDiscrepancy={false}
        />
        <View style={styles.verticalDivider} />
        <SummaryCard
          title="Premios"
          amount={premiumsPaid}
          type="paid"
          showBalance={showBalance}
        />
        <View style={styles.verticalDivider} />
        <SummaryCard
          title="Ganancia"
          amount={netResult}
          type="net"
          showBalance={showBalance}
        />
      </View>

      {/* Action Buttons */}
      <Flex gap={8} style={styles.actionsRow}>
        <ButtonKit
          appearance="ghost"
          status="warning"
          size="small"
          style={[styles.actionButton, styles.reglamentoButton]}
          onPress={() => onRulePress(draw.id)}
          label="Reglas"
        />
        
        <ButtonKit
          appearance="outline"
          status="primary"
          size="small"
          disabled={effectiveStatus === DRAW_STATUS.SCHEDULED || effectiveStatus === DRAW_STATUS.PENDING}
          style={[
            styles.actionButton,
            (effectiveStatus === DRAW_STATUS.SCHEDULED || effectiveStatus === DRAW_STATUS.PENDING) && styles.disabledButton
          ]}
          onPress={handleBetsListPress}
          label="Ver Lista"
        />
        {effectiveStatus === DRAW_STATUS.CLOSED ? (
          <ButtonKit
            appearance="filled"
            status="primary"
            size="small"
            style={styles.actionButton}
            onPress={handleRewardsPress}
            label="Premios"
          />
        ) : (
          <ButtonKit
            appearance="filled"
            status="primary"
            size="small"
            disabled={effectiveStatus === DRAW_STATUS.SCHEDULED || effectiveStatus === DRAW_STATUS.PENDING || effectiveStatus === DRAW_STATUS.CLOSED}
            style={[
              styles.actionButton, 
              (effectiveStatus === DRAW_STATUS.SCHEDULED || effectiveStatus === DRAW_STATUS.PENDING || effectiveStatus === DRAW_STATUS.CLOSED) && styles.disabledButton
            ]}
            onPress={handleCreateBetPress}
            label={
              effectiveStatus === DRAW_STATUS.SCHEDULED || effectiveStatus === DRAW_STATUS.PENDING 
                ? "Próximamente" 
                : effectiveStatus === DRAW_STATUS.CLOSED 
                  ? "Cerrado"
                  : "Anotar"
            }
          />
        )}
      </Flex>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  criticalContainer: {
    backgroundColor: '#FFF5F8',
  },
  header: {
    marginBottom: 12,
    minHeight: 40,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  statusWrapper: {
    minWidth: 80,
  },
  drawTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E3A59',
  },
  dateText: {
    fontSize: 11,
    color: '#8F9BB3',
  },
  financialRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E4E9F2',
    height: '60%',
    alignSelf: 'center',
  },
  actionsRow: {
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#EDF1F7',
    borderColor: '#E4E9F2',
  },
  reglamentoButton: {
    flex: 0.7,
  },
  // Estilos para indicador offline
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  offlineBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
