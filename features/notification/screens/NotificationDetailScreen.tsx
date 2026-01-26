import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Layout, TopNavigation, TopNavigationAction, Icon, Button } from '@ui-kitten/components';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppNotification } from '../core/model';
import { useNotificationStore } from '../core/store';
import { MARK_AS_READ_REQUESTED, NOTIFICATION_DESELECTED } from '../core/msg';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const notificationParam = params.notification;
  
  // Parse the notification from the route params
  const notification: AppNotification = typeof notificationParam === 'string' 
    ? JSON.parse(decodeURIComponent(notificationParam)) 
    : notificationParam as any;
    
  const { model, dispatch } = useNotificationStore.getState();

  useEffect(() => {
    if (notification && notification.status === 'pending') {
      dispatch({ type: 'MARK_AS_READ_REQUESTED', notificationId: notification.id });
    }
    
    return () => {
      if (notification) {
        dispatch(NOTIFICATION_DESELECTED());
      }
    };
  }, [notification?.id, notification?.status]);

  const getStatusIcon = () => {
    switch (notification.type) {
      case 'info':
        return <Icon name="info-outline" fill="#2196F3" width={32} height={32} />;
      case 'warning':
        return <Icon name="alert-triangle-outline" fill="#FF9800" width={32} height={32} />;
      case 'error':
        return <Icon name="alert-circle-outline" fill="#F44336" width={32} height={32} />;
      case 'success':
        return <Icon name="checkmark-circle-2-outline" fill="#4CAF50" width={32} height={32} />;
      default:
        return <Icon name="bell-outline" fill="#757575" width={32} height={32} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackAction = () => {
    router.back();
  };

 const BackAction = () => (
    <TopNavigationAction
      icon={(props) => <Icon {...props} name="arrow-back" />}
      onPress={handleBackAction}
    />
  );

  return (
    <Layout style={{ flex: 1 }}>
      <TopNavigation
        title="Detalle de Notificación"
        alignment="center"
        accessoryLeft={BackAction}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[
              styles.statusText,
              notification.status === 'pending' ? styles.pendingStatus : styles.readStatus
            ]}>
              {notification.status === 'pending' ? 'PENDIENTE' : 'LEÍDA'}
            </Text>
            {notification.readAt && notification.status === 'read' && (
              <Text style={styles.readTime}>
                Leída: {formatDate(notification.readAt)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
          
          <View style={styles.metadata}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            <Text style={styles.metadataText}>Fecha de creación: {formatDate(notification.createdAt)}</Text>
            {notification.userId && (
              <Text style={styles.metadataText}>Usuario: {notification.userId}</Text>
            )}
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Metadatos:</Text>
                {Object.entries(notification.metadata).map(([key, value]) => (
                  <Text key={key} style={styles.metadataText}>
                    {key}: {JSON.stringify(value)}
                  </Text>
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {notification.status === 'pending' && (
        <View style={styles.footer}>
          <Button
            style={styles.markAsReadButton}
            size="large"
            onPress={() => dispatch({ type: 'MARK_AS_READ_REQUESTED', notificationId: notification.id })}
          >
            Marcar como leída
          </Button>
        </View>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pendingStatus: {
    color: '#2196F3',
  },
  readStatus: {
    color: '#4CAF50',
  },
  readTime: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#33',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  metadata: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  markAsReadButton: {
    width: '100%',
 },
});