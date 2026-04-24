import React, { useState, useEffect, memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Card } from '@/shared/components';
import { DRAW_STATUS, DrawStatus, DrawType } from '@/types';
import { TimerRepository } from '@/shared/repositories/system/time';
import { parseServerDateTime } from '@/shared/services/draw/mapper';
import { DrawHeader } from './draw_header';
import { FinancialRow } from './financial_row';
import { DrawActions } from './draw_actions';

interface DrawItemProps {
  draw: DrawType;
  onBetsListPress: (id: string, title: string, draw: DrawType) => void;
  onCreateBetPress: (id: string, title: string, draw: DrawType) => void;
  showBalance: boolean;
}

const DrawItemComponent: React.FC<DrawItemProps> = ({
  draw,
  onBetsListPress,
  onCreateBetPress,
  showBalance,
}: DrawItemProps) => {
  const [currentTime, setCurrentTime] = useState(TimerRepository.getTrustedNow(Date.now()));

  useEffect(() => {
    if (!draw.betting_end_time) return;
    const parsedEnd = parseServerDateTime(draw.betting_end_time);
    if (!parsedEnd) return;
    const bettingEndTime = parsedEnd.getTime();
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
    } else if (timeRemaining > 0) {
      timeoutId = setTimeout(startInterval, timeRemaining - 5 * 60 * 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [draw.betting_end_time]);

  const drawId = String(draw.id);
  // SSOT: Usar draw.totalCollected (enriquecido por enrichDraws con pending + synced bets)
  // totalsByDrawId puede estar vacío si no se ha sincronizado
  const localCollected = draw.totalCollected ?? 0;
  const premiumsPaid = draw.premiumsPaid ?? 0;
  const netResult = draw.netResult ?? 0;
  // betCount viene de _offline.pendingCount (agregado por enrichDraws)
  const betCount = draw._offline?.pendingCount ?? 0;

  const getDrawStatus = useMemo((): DrawStatus => {
    const now = currentTime;
    
    // Verificar si las fechas existen
    const hasStartTime = draw.betting_start_time;
    const hasEndTime = draw.betting_end_time;
    
    if (!hasStartTime || !hasEndTime) {
      // Si no hay fechas, usar el status del backend
      return draw.status as DrawStatus;
    }
    
    const startTime = new Date(draw.betting_start_time!).getTime();
    const endTime = new Date(draw.betting_end_time!).getTime();
    
    // Según drawRepository.ts - lógica SSOT:
    // isBettingOpen: now >= startTime && now <= endTime
    if (now >= startTime && now <= endTime) {
      return DRAW_STATUS.OPEN;
    }
    
    // isExpired: now > endTime
    if (now > endTime) {
      return DRAW_STATUS.CLOSED;
    }
    
    // isScheduled: now < startTime (y no ha expirado)
    if (now < startTime) {
      return DRAW_STATUS.SCHEDULED;
    }
    
    // Por defecto, usar el status del backend
    return draw.status as DrawStatus;
  }, [draw, currentTime]);

  const effectiveStatus = getDrawStatus;

  const getClosingTimeInfo = useMemo(() => {
    if (!draw.betting_end_time || effectiveStatus !== DRAW_STATUS.OPEN) return null;
    const parsedEnd = parseServerDateTime(draw.betting_end_time);
    if (!parsedEnd) return null;
    const diffMs = parsedEnd.getTime() - currentTime;
    if (diffMs <= 0 || diffMs > 5 * 60 * 1000) return null;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return { isCritical: true, timeLeft: `${diffMins}:${diffSecs.toString().padStart(2, '0')}` };
  }, [draw.betting_end_time, effectiveStatus, currentTime]);

  const getOpeningTimeInfo = useMemo(() => {
    if (!draw.betting_start_time || effectiveStatus !== DRAW_STATUS.SCHEDULED) return null;
    const parsedStart = parseServerDateTime(draw.betting_start_time);
    if (!parsedStart) return null;
    const diffMs = parsedStart.getTime() - currentTime;
    if (diffMs <= 0) return null;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return { timeLeft: `${diffMins}:${diffSecs.toString().padStart(2, '0')}` };
  }, [draw.betting_start_time, effectiveStatus, currentTime]);

  const closingInfo = getClosingTimeInfo;
  const openingInfo = getOpeningTimeInfo;

  return (
    <Card style={[styles.container, closingInfo?.isCritical && styles.criticalContainer]}>
      <DrawHeader
        draw={draw}
        effectiveStatus={effectiveStatus}
        closingInfo={closingInfo}
        openingInfo={openingInfo}
        betCount={betCount}
      />
      <FinancialRow
        totalCollected={localCollected}
        premiumsPaid={premiumsPaid}
        netResult={netResult}
        showBalance={showBalance}
      />
      <DrawActions
        effectiveStatus={effectiveStatus}
        onBetsListPress={onBetsListPress}
        onCreateBetPress={onCreateBetPress}
        draw={draw}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
  },
  criticalContainer: {
    backgroundColor: '#FFF5F8',
  },
});

const DrawItemMemoized = memo(DrawItemComponent);

export default DrawItemMemoized;