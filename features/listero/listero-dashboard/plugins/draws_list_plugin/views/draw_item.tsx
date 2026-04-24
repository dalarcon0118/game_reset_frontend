import React, { useState, useEffect, memo } from 'react';
import { StyleSheet } from 'react-native';
import { Card } from '@/shared/components';
import { DRAW_STATUS, DrawStatus } from '@/types';
import { Draw, isBettingOpen, isExpired } from '../core/types';
import { TimerRepository } from '@/shared/repositories/system/time';
import { TotalsByDrawIdMap, DrawFinancialTotals } from '../model';
import logger from '@/shared/utils/logger';
import { parseServerDateTime } from '@/shared/services/draw/mapper';
import DrawHeader from './draw_header';
import FinancialRow from './financial_row';
import DrawActions from './draw_actions';

const log = logger.withTag('DrawItemComponent');

interface DrawItemProps {
  draw: Draw;
  totalsByDrawId: TotalsByDrawIdMap;
  onBetsListPress: (id: string, title: string, draw: Draw) => void;
  onCreateBetPress: (id: string, title: string, draw: Draw) => void;
  showBalance: boolean;
}

const DrawItemComponent: React.FC<DrawItemProps> = ({
  draw,
  totalsByDrawId,
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
    } else {
      timeoutId = setTimeout(startInterval, timeRemaining - 5 * 60 * 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [draw.betting_end_time]);

  useEffect(() => {
    log.debug(`DrawItemComponent: is_betting_open = ${draw.is_betting_open}, betting_end_time = ${draw.betting_end_time}`);
  }, [draw]);

  const drawId = draw.id.toString();
  const totals: DrawFinancialTotals | undefined = totalsByDrawId.get(drawId);

  const premiumsPaid = draw.premiumsPaid ?? 0;
  const betCount = totals?.betCount ?? 0;

  const getDrawStatus = (): DrawStatus => {
    if (isBettingOpen(draw, currentTime)) return DRAW_STATUS.OPEN;
    if (isExpired(draw, currentTime)) return DRAW_STATUS.CLOSED;
    return draw.status as DrawStatus;
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
        timeLeft: `${diffMins}:${diffSecs.toString().padStart(2, '0')}`,
      };
    }
    return null;
  };

  const closingInfo = getClosingTimeInfo();

  return (
    <Card style={[styles.container, closingInfo?.isCritical && styles.criticalContainer]}>
      <DrawHeader
        draw={draw}
        effectiveStatus={effectiveStatus}
        closingInfo={closingInfo}
        betCount={betCount}
      />

      <FinancialRow
        totals={totals}
        premiumsPaid={premiumsPaid}
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
});

const DrawItemMemoized = memo(DrawItemComponent);

export default DrawItemMemoized;
