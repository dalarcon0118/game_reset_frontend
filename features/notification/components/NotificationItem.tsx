import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '@ui-kitten/components';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, Bell } from 'lucide-react-native';
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
        return <Info size={24} color="#2196F3" />;
      case 'warning':
        return <AlertTriangle size={24} color="#FF9800" />;
      case 'error':
        return <AlertCircle size={24} color="#F44336" />;
      case 'success':
        return <CheckCircle2 size={24} color="#4CAF50" />;
      default:
        return <Bell size={24} color="#757575" />;
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