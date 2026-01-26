import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout, TopNavigation, TopNavigationAction, Icon } from '@ui-kitten/components';
import { router } from 'expo-router';
import { NotificationList } from '../components/NotificationList';
import { AppNotification } from '../core/model';

export default function NotificationsScreen() {
  const handleNotificationPress = (notification: AppNotification) => {
    // Pass the notification as a parameter to the detail screen
    const notificationParam = encodeURIComponent(JSON.stringify(notification));
    router.push(`/notification/detail?notification=${notificationParam}`);
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

  const BellAction = () => (
    <TopNavigationAction
      icon={(props) => <Icon {...props} name="bell" />}
      onPress={() => {}}
    />
  );

  return (
    <Layout style={{ flex: 1 }}>
      <TopNavigation
        title="Notificaciones"
        alignment="center"
        accessoryLeft={BackAction}
        accessoryRight={BellAction}
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