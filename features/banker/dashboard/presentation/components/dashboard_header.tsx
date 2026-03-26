import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelpCircle, RefreshCw, User, Bell } from 'lucide-react-native';
import { MenuItem, OverflowMenu, Text, useTheme } from '@ui-kitten/components';

import { Flex } from '@/shared/components/flex';
import { NotificationBadge } from '@/features/notification/components/notification_badge';
import { useAuth } from '../../../../auth';
import { es } from '@/config/language/es';
import { useBankerDashboardStore } from '../../core';
import { NAVIGATE_TO_NOTIFICATIONS, NAVIGATE_TO_SETTINGS } from '../../core/msg';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { model, dispatch } = useBankerDashboardStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const isLoading = model.agencies.type === 'Loading' || model.summary.type === 'Loading';
  const onRefresh = () => dispatch({ type: 'REFRESH_CLICKED' });

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const renderMenuAnchor = () => (
    <TouchableOpacity onPress={toggleMenu} activeOpacity={0.7}>
      <View style={[styles.profileIcon, { backgroundColor: theme['background-basic-color-2'], borderColor: theme['border-basic-color-3'] }]}>
        <User size={24} color={theme['color-primary-500']} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), backgroundColor: theme['background-basic-color-1'] }]}>
      {/* Top Row: User Info and App Name */}
      <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 15 }]}>
        <Flex align="center" gap={10}>
          <OverflowMenu
            anchor={renderMenuAnchor}
            visible={menuVisible}
            onBackdropPress={toggleMenu}
          >
            <MenuItem title={es.banker.dashboard.header.logout} onPress={() => {
              toggleMenu();
              logout();
            }} />
          </OverflowMenu>
          <TouchableOpacity 
            onPress={() => dispatch(NAVIGATE_TO_SETTINGS())}
            activeOpacity={0.7}
          >
            <View>
              <Text category="s1" style={[styles.userName, { color: theme['text-basic-color'] }]}>{user?.username || 'Usuario'}</Text>
              <Text category="c1" style={[styles.structureName, { color: theme['text-hint-color'] }]}>{user?.structure?.name}</Text>
            </View>
          </TouchableOpacity>
        </Flex>
        <Text category="h6" style={[styles.appName, { color: theme['color-primary-500'] }]}>MONSTER</Text>
      </Flex>

      {/* Bottom Row: Action Icons */}
      <Flex align="center" justify="end" gap={15}>
        <TouchableOpacity style={styles.iconButton}>
          <HelpCircle size={24} color={theme['text-basic-color']} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => dispatch(NAVIGATE_TO_NOTIFICATIONS())}
        >
          <Bell size={24} color={theme['text-basic-color']} />
          <NotificationBadge size="tiny" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onRefresh} disabled={isLoading} activeOpacity={0.7}>
          <View style={[styles.iconButton, isLoading && styles.loadingButton]}>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme['color-primary-500']} />
            ) : (
              <RefreshCw size={24} color={theme['text-basic-color']} />
            )}
          </View>
        </TouchableOpacity>
      </Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  structureName: {
    fontSize: 12,
  },
  appName: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  loadingButton: {
    opacity: 0.7,
  },
});
