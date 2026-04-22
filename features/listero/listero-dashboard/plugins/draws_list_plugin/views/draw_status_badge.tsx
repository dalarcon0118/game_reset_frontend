import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { match } from 'ts-pattern';
import { Badge, Label } from '@/shared/components';
import { DRAW_STATUS, DrawStatus } from '@/types';
import Colors from '@/constants/colors';
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
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
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
      closingInfo?.isCritical ? theme.error : theme.success
    )
    .with(DRAW_STATUS.CLOSED, () => theme.error)
    .with(DRAW_STATUS.SCHEDULED, DRAW_STATUS.PENDING, () => theme.textTertiary)
    .otherwise(() => theme.textTertiary);

  const textColor = colorScheme === 'dark' ? theme.background : '#FFFFFF';

  return (
    <View style={styles.container}>
      <Badge
        color={badgeColor}
        textColor={textColor}
        content={badgeContent}
      />
      {status === DRAW_STATUS.OPEN && closingInfo?.isCritical && (
        <AlarmClock size={20} color={theme.error} style={styles.alarmIcon} />
      )}
      {hasOfflineBets && (
        <View style={[styles.offlineBadge, { backgroundColor: theme.warning }]}>
          <CloudOff size={10} color={textColor} />
          <Label style={[styles.offlineBadgeText, { color: textColor }]}>{betCount}</Label>
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
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default DrawStatusBadge;