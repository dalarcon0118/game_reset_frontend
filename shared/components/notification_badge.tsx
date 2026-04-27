import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Bell } from 'lucide-react-native';
import { IconButton } from './icon_button';
import { formatBadgeCount } from '@/shared/utils/format';

export interface NotificationBadgeProps {
  unreadCount: number;
  onPress?: () => void;
  iconColor: string;
  backgroundColor: string;
  badgeColor: string;
  style?: StyleProp<ViewStyle>;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = React.memo(
  ({ unreadCount, onPress, iconColor, backgroundColor, badgeColor, style }) => (
    <IconButton
      onPress={onPress}
      accessibilityLabel={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
      style={[styles.circle, { backgroundColor }, style]}
    >
      <View style={styles.bellContent}>
        <Bell size={22} color={iconColor} />
        {unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{formatBadgeCount(unreadCount)}</Text>
          </View>
        ) : null}
      </View>
    </IconButton>
  ),
);
NotificationBadge.displayName = 'NotificationBadge';

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellContent: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
});