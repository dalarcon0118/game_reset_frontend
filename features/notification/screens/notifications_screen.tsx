import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { router } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { NotificationList } from '../components/notification_list';
import { AppNotification } from '../core/model';
import { useNotificationStore, selectNotificationDispatch } from '../core/store';
import { NAVIGATE_BACK, NAVIGATE_TO_DETAIL } from '../core/msg';

export default function NotificationsScreen() {
  const dispatch = useNotificationStore(selectNotificationDispatch);

  const handleNotificationPress = React.useCallback((notification: AppNotification) => {
    dispatch(NAVIGATE_TO_DETAIL(notification));
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

  const renderBellAction = React.useCallback(() => (
    <TopNavigationAction
      icon={(props: any) => (
        <View style={props?.style as any}>
          <Bell size={24} color="#2E3A59" />
        </View>
      )}
      onPress={() => { }}
    />
  ), []);

  return (
    <Layout style={{ flex: 1 }}>
      <TopNavigation
        title="Notificaciones"
        alignment="center"
        accessoryLeft={renderBackAction}
        accessoryRight={renderBellAction}
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