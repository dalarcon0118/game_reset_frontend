import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl } from 'react-native';
import { Button, Layout } from '@ui-kitten/components';
import { BellOff } from 'lucide-react-native';
import { useNotificationStore, selectNotificationModel, selectNotificationDispatch } from '../core/store';
import { NotificationItem } from './notification_item';
import { AppNotification, Model } from '../core/model';
import {
  FETCH_NOTIFICATIONS_REQUESTED,
  MARK_ALL_AS_READ_REQUESTED,
  FILTER_CHANGED,
  REFRESH_NOTIFICATIONS
} from '../core/msg';

interface NotificationListProps {
  onNotificationPress: (notification: AppNotification) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ onNotificationPress }) => {
  const model = useNotificationStore(selectNotificationModel) as Model;
  const dispatch = useNotificationStore(selectNotificationDispatch);

  useEffect(() => {
    if (model.notifications.type === 'NotAsked') {
      dispatch(FETCH_NOTIFICATIONS_REQUESTED());
    }
  }, []);

  const handleRefresh = () => {
    dispatch(REFRESH_NOTIFICATIONS());
  };

  const handleMarkAllAsRead = () => {
    dispatch(MARK_ALL_AS_READ_REQUESTED());
  };

  const handleFilterChange = (filter: 'all' | 'pending' | 'read') => {
    dispatch(FILTER_CHANGED(filter));
  };

  const handleMarkAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ_REQUESTED', notificationId: id });
  };

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      onMarkAsRead={handleMarkAsRead}
      onPress={onNotificationPress}
    />
  );

  const renderEmptyState = () => (
    <Layout style={styles.emptyState}>
      <BellOff size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No hay notificaciones</Text>
      <Text style={styles.emptyMessage}>Las notificaciones aparecerán aquí cuando estén disponibles</Text>
    </Layout>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filterContainer}>
        <Button
          size="small"
          appearance={model.currentFilter === 'all' ? 'filled' : 'outline'}
          status="basic"
          onPress={() => handleFilterChange('all')}
        >
          Todas
        </Button>
        <Button
          size="small"
          appearance={model.currentFilter === 'pending' ? 'filled' : 'outline'}
          status="basic"
          onPress={() => handleFilterChange('pending')}
        >
          {`Pendientes (${model.unreadCount})`}
        </Button>
        <Button
          size="small"
          appearance={model.currentFilter === 'read' ? 'filled' : 'outline'}
          status="basic"
          onPress={() => handleFilterChange('read')}
        >
          Leídas
        </Button>
      </View>

      {model.unreadCount > 0 && (
        <Button
          size="small"
          appearance="ghost"
          status="basic"
          onPress={handleMarkAllAsRead}
        >
          Marcar todas como leídas
        </Button>
      )}
    </View>
  );

  return (
    <Layout style={styles.container}>
      {renderHeader()}

      <FlatList
        data={model.notifications.type === 'Success' ? model.notifications.data : []}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={model.notifications.type === 'Loading'}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});