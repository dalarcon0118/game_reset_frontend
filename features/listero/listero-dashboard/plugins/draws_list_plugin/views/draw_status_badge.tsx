import React from 'react';
import { StyleSheet, View } from 'react-native';
import { match } from 'ts-pattern';
import { Badge, Label } from '@/shared/components';
import { DRAW_STATUS, DrawStatus } from '@/types';
import { AlarmClock, CloudOff } from 'lucide-react-native';

interface DrawStatusBadgeProps {
  status: DrawStatus;
  closingInfo: {
    isCritical: boolean;
    timeLeft: string;
  } | null;
  betCount: number;
}

const DrawStatusBadge: React.FC<DrawStatusBadgeProps> = ({
  status,
  closingInfo,
  betCount,
}) => {
  const hasOfflineBets = betCount > 0;

  const badgeContent = match(status)
    .with(DRAW_STATUS.OPEN, () =>
      closingInfo?.isCritical
        ? `Cierra en ${closingInfo.timeLeft}`
        : 'Abierto'
    )
    .with(DRAW_STATUS.CLOSED, () => 'Cerrado')
    .with(DRAW_STATUS.SCHEDULED, () => 'Programado')
    .with(DRAW_STATUS.PENDING, () => 'Programado')
    .otherwise(() => status);

  const badgeColor = match(status)
    .with(DRAW_STATUS.OPEN, () =>
      closingInfo?.isCritical ? '#FF3D71' : '#00D68F'
    )
    .with(DRAW_STATUS.CLOSED, () => '#FF3D71')
    .with(DRAW_STATUS.SCHEDULED, DRAW_STATUS.PENDING, () => '#8F9BB3')
    .otherwise(() => '#8F9BB3');

  return (
    <View style={styles.container}>
      <Badge
        color={badgeColor}
        textColor="#FFFFFF"
        content={badgeContent}
      />
      {status === DRAW_STATUS.OPEN && closingInfo?.isCritical && (
        <AlarmClock size={20} color="#FF3D71" style={styles.alarmIcon} />
      )}
      {hasOfflineBets && (
        <View style={styles.offlineBadge}>
          <CloudOff size={10} color="#fff" />
          <Label style={styles.offlineBadgeText}>{betCount}</Label>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmIcon: {
    marginLeft: 4,
  },
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

export default DrawStatusBadge;
