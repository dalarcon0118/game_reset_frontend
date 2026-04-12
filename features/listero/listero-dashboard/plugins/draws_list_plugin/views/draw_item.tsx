import React from 'react';
const { memo, useState, useEffect } = React;
import { StyleSheet, View } from 'react-native';
import { match } from 'ts-pattern';
import { Badge, ButtonKit, Card, Flex, Label } from '@/shared/components';
import { DRAW_STATUS } from '@/types';
import { AlarmClock, CalendarClock, Clock3, CloudOff } from 'lucide-react-native';
import { Draw, isBettingOpen, isExpired } from '../core/types';
import { TimerRepository } from '@/shared/repositories/system/time';
import { TotalsByDrawIdMap, DrawFinancialTotals } from '../model';
import SummaryCard from './summary_card';
import logger from '@/shared/utils/logger';
import { parseServerDateTime } from '@/shared/services/draw/mapper';
const log = logger.withTag('DrawItemComponent');
// Props del componente - SSOT: Draw y Totals vienen de fuentes separadas
interface DrawItemProps {
  draw: Draw;
  totalsByDrawId: TotalsByDrawIdMap;
  onRulePress: (id: string | number) => void;
  onRewardsPress: (id: string, title: string, draw: Draw) => void;
  onBetsListPress: (id: string, title: string, draw: Draw) => void;
  onCreateBetPress: (id: string, title: string, draw: Draw) => void;
  showBalance: boolean;
}

const DrawItemComponent: React.FC<DrawItemProps> = ({
   draw,
   totalsByDrawId,
   onRulePress,
   onRewardsPress,
   onBetsListPress,
   onCreateBetPress,
   showBalance
}: DrawItemProps) => {

  const [currentTime, setCurrentTime] = useState(TimerRepository.getTrustedNow(Date.now()));

  useEffect(() => {
    if (!draw.betting_end_time) return;
    const parsedEnd = parseServerDateTime(draw.betting_end_time);
    if (!parsedEnd) return;
    const bettingEndTime = parsedEnd.getTime();
    
    // Usar tiempo confiable para el cálculo inicial del countdown
    const nowTrusted = TimerRepository.getTrustedNow(Date.now());
    const timeRemaining = bettingEndTime - nowTrusted;
    
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const tick = () => setCurrentTime(TimerRepository.getTrustedNow(Date.now()));
    const startInterval = () => {
      tick();
      intervalId = setInterval(tick, 1000);
    };

    if (timeRemaining <= 5 * 60 * 1000) {
      startInterval();
    } else {
      timeoutId = setTimeout(startInterval, timeRemaining - 5 * 60 * 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [draw.betting_end_time]);

  useEffect(() => {
   log.debug(`DrawItemComponent: is_betting_open = ${draw.is_betting_open}, betting_end_time = ${draw.betting_end_time}`)
  }, [draw]);


  // SSOT: Obtener totales financieros desde BetRepository (totalsByDrawId)
  const drawId = draw.id.toString();
  const totals: DrawFinancialTotals | undefined = totalsByDrawId.get(drawId);

  // Valores financieros
  // totalCollected y netResult vienen de BetRepository (apuestas locales)
  // premiumsPaid viene del Draw (backend) - refleja premios calculados por el servidor
  const totalCollected = totals?.totalCollected ?? 0;
  const premiumsPaid = draw.premiumsPaid ?? 0;
  const netResult = totals?.netResult ?? 0;
  const betCount = totals?.betCount ?? 0;

  const handleRewardsPress = () => {
    onRewardsPress(draw.id.toString(), draw.source || '', draw);
  }

  const handleBetsListPress = () => {
    onBetsListPress(draw.id.toString(), draw.source || '', draw);
  }

  const handleCreateBetPress = () => {
    onCreateBetPress(draw.id.toString(), draw.source || '', draw);
  }

  const getDrawStatus = () => {
    // Usar la lógica unificada de types.ts para consistencia con los filtros
    if (isBettingOpen(draw, currentTime)) return DRAW_STATUS.OPEN;
    if (isExpired(draw, currentTime)) return DRAW_STATUS.CLOSED;
    return draw.status;
  };

  const effectiveStatus = getDrawStatus();

  const getClosingTimeInfo = () => {
    if (!draw.betting_end_time || effectiveStatus !== DRAW_STATUS.OPEN) return null;

    const now = currentTime;
    const parsedEnd = parseServerDateTime(draw.betting_end_time);
    if (!parsedEnd) return null;
    const endTime = parsedEnd.getTime();
    const diffMs = endTime - now;
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
      const date = parseServerDateTime(dateString);
      if (!date) return 'N/A';
      if (isNaN(date.getTime())) return 'N/A';
      
      // Usar el comportamiento por defecto de toLocaleTimeString para 
      // respetar la zona horaria real del dispositivo (ej. São Paulo).
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
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
      {/* SSOT: totalCollected/netResult de BetRepository, premiumsPaid del Draw (backend) */}
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

// Memoizar DrawItem - la comparación por defecto de React.memo es suficiente
// El componente se re-renderizará cuando currentTime cambie (cada segundo) para actualizar el countdown
// Las其他props (draw, totalsByDrawId) solo cambian cuando hay datos reales del servidor
const DrawItemMemoized = memo(DrawItemComponent);

export default DrawItemMemoized;
