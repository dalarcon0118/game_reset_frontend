import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '@ui-kitten/components';
import { Info, AlertTriangle, AlertCircle, CheckCircle2, Bell, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AppNotification } from '../core/model';
import { formatServerDateToLocal, formatServerTimeToLocal } from '@/shared/utils/formatters';

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
  const [expanded, setExpanded] = useState(false);

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
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const dateStr = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${dateStr} ${timeStr}`;
  };

  const messageLength = notification.message.length;
  const shouldShowExpandButton = messageLength > 100;

  return (
    <TouchableOpacity onPress={() => onPress(notification)}>
      <Card style={[styles.card, getStatusStyle()]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={expanded ? undefined : 1}>
                {notification.title}
              </Text>
              {shouldShowExpandButton && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  style={styles.expandButton}
                >
                  {expanded ? (
                    <ChevronUp size={20} color="#666" />
                  ) : (
                    <ChevronDown size={20} color="#666" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.message} numberOfLines={expanded ? undefined : 3}>
              {notification.message}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.timestamp}>
                {formatDate(notification.createdAt)}
              </Text>
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
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pendingContainer: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  readContainer: {
    backgroundColor: '#FAFAFA',
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
    flex: 1,
  },
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
});