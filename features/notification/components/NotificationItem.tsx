import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Card, Icon, Button } from '@ui-kitten/components';
import { AppNotification } from '../core/model';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onPress: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onPress,
}) => {
  const getStatusIcon = () => {
    switch (notification.type) {
      case 'info':
        return <Icon name="info-outline" fill="#2196F3" width={24} height={24} />;
      case 'warning':
        return <Icon name="alert-triangle-outline" fill="#FF9800" width={24} height={24} />;
      case 'error':
        return <Icon name="alert-circle-outline" fill="#F44336" width={24} height={24} />;
      case 'success':
        return <Icon name="checkmark-circle-2-outline" fill="#4CAF50" width={24} height={24} />;
      default:
        return <Icon name="bell-outline" fill="#757575" width={24} height={24} />;
    }
  };

  const getStatusStyle = () => {
    if (notification.status === 'pending') {
      return styles.pendingContainer;
    }
    return styles.readContainer;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity onPress={() => onPress(notification)}>
      <Card style={[styles.card, getStatusStyle()]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.timestamp}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
          {notification.status === 'pending' && (
            <Button
              size="tiny"
              appearance="ghost"
              status="basic"
              onPress={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              Marcar como leído
            </Button>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
 },
  pendingContainer: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  readContainer: {
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});