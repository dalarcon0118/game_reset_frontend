import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotificationStore } from '../core/store';

interface NotificationBadgeProps {
  maxCount?: number;
  showZero?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  status?: 'basic' | 'primary' | 'success' | 'info' | 'warning' | 'danger';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  maxCount = 99,
  showZero = false,
  size = 'small',
  status = 'danger',
}) => {
  const { model } = useNotificationStore.getState();
  
  const unreadCount = model.unreadCount;
  
  if (!showZero && unreadCount === 0) {
    return null;
  }
  
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();
  
  const getBadgeSize = () => {
    switch (size) {
      case 'tiny':
        return { width: 16, height: 16, fontSize: 10 };
      case 'small':
        return { width: 20, height: 20, fontSize: 11 };
      case 'medium':
        return { width: 24, height: 24, fontSize: 12 };
      case 'large':
        return { width: 28, height: 28, fontSize: 14 };
      default:
        return { width: 20, height: 20, fontSize: 11 };
    }
  };
  
  const getBadgeColor = () => {
    switch (status) {
      case 'primary':
        return '#2196F3';
      case 'success':
        return '#4CAF50';
      case 'info':
        return '#03A9F4';
      case 'warning':
        return '#FF9800';
      case 'danger':
        return '#F44336';
      case 'basic':
      default:
        return '#9E9E9E';
    }
  };
  
  const badgeStyle = getBadgeSize();
  
  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeStyle.width,
          height: badgeStyle.height,
          backgroundColor: getBadgeColor(),
        }
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: badgeStyle.fontSize }]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
