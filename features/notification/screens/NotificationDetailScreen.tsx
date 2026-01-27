import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Layout, TopNavigation, TopNavigationAction, Button } from '@ui-kitten/components';
import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Info, AlertTriangle, AlertCircle, CheckCircle2, Bell } from 'lucide-react-native';
import { AppNotification, Model } from '../core/model';
import { useNotificationStore, selectNotificationModel, selectNotificationDispatch } from '../core/store';
import { NAVIGATE_BACK } from '../core/msg';

export default function NotificationDetailScreen() {
  const model = useNotificationStore(selectNotificationModel) as Model;
  const dispatch = useNotificationStore(selectNotificationDispatch);

  // Usamos la notificación del modelo si está seleccionada, sino intentamos parsear de los params
  const params = useLocalSearchParams();
  const notificationParam = params.notification;

  const notificationFromParams: AppNotification | null = typeof notificationParam === 'string'
    ? JSON.parse(decodeURIComponent(notificationParam))
    : null;

  const notification = model.selectedNotification || notificationFromParams;

  if (!notification) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No se encontró la notificación</Text>
        <Button onPress={() => dispatch(NAVIGATE_BACK())}>Volver</Button>
      </Layout>
    );
  }

  const getStatusIcon = () => {
    switch (notification.type) {
      case 'info':
        return <Info size={32} color="#2196F3" />;
      case 'warning':
        return <AlertTriangle size={32} color="#FF9800" />;
      case 'error':
        return <AlertCircle size={32} color="#F44336" />;
      case 'success':
        return <CheckCircle2 size={32} color="#4CAF50" />;
      default:
        return <Bell size={32} color="#757575" />;
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
    dispatch(NAVIGATE_BACK());
  };

  const BackAction = () => (
    <TopNavigationAction
      icon={(props: any) => (
        <View style={props?.style as any}>
          <ArrowLeft size={24} color="#2E3A59" />
        </View>
      )}
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