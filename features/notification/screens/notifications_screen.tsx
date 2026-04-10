import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Layout, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { ArrowLeft, Bell, Trash2 } from 'lucide-react-native';
import { NotificationList } from '../components/notification_list';
import { AppNotification } from '../core/model';
import { NotificationModule } from '../core/store';
import { NAVIGATE_BACK, NAVIGATE_TO_DETAIL, CLEAR_ALL_NOTIFICATIONS_REQUESTED } from '../core/msg';

export default function NotificationsScreen() {
  const dispatch = NotificationModule.useDispatch();

  React.useEffect(() => {
    dispatch({ type: 'REFRESH_NOTIFICATIONS' });
  }, [dispatch]);

  const handleNotificationPress = React.useCallback((notification: AppNotification) => {
    dispatch(NAVIGATE_TO_DETAIL(notification.id));
  }, [dispatch]);

  const handleBackAction = React.useCallback(() => {
    dispatch(NAVIGATE_BACK());
  }, [dispatch]);

  const renderBackAction = React.useCallback(() => (
    <TopNavigationAction
      icon={(props: any) => (
        <View style={props?.style as any}>
          <ArrowLeft size={24} color="#2E3A59" />
        </View>
      )}
      onPress={handleBackAction}
    />
  ), [handleBackAction]);

  const renderClearAction = React.useCallback(() => (
    <TopNavigationAction
      icon={(props: any) => (
        <View style={props?.style as any}>
          <Trash2 size={24} color="#FF3D71" />
        </View>
      )}
      onPress={() => {
        Alert.alert(
          'Limpiar notificaciones',
          '¿Estás seguro de que deseas eliminar todas las notificaciones?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => dispatch(CLEAR_ALL_NOTIFICATIONS_REQUESTED())
            },
          ]
        );
      }}
    />
  ), [dispatch]);

  return (
    <Layout style={{ flex: 1 }}>
      <TopNavigation
        title="Notificaciones"
        alignment="center"
        accessoryLeft={renderBackAction}
        accessoryRight={renderClearAction}
      />

      <NotificationList onNotificationPress={handleNotificationPress} />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
