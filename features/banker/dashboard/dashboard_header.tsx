import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { HelpCircle, RefreshCw, User, Bell } from 'lucide-react-native';
import { MenuItem, OverflowMenu, Text } from '@ui-kitten/components';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { NotificationBadge } from '@/features/notification/components/notification_badge';
import { useAuth } from '../../auth';
import { es } from '../../language/es';
import { useDashboardStore, selectDashboardDispatch } from './core';
import { NAVIGATE_TO_NOTIFICATIONS, NAVIGATE_TO_SETTINGS } from './core/msg';

interface DashboardHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ isLoading, onRefresh }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const dispatch = useDashboardStore(selectDashboardDispatch);
  const [menuVisible, setMenuVisible] = React.useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const renderMenuAnchor = () => (
    <TouchableOpacity onPress={toggleMenu} activeOpacity={0.7}>
      <View style={styles.profileIcon}>
        <User size={24} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
              <Text category="s1" style={styles.userName}>{user?.username || 'Usuario'}</Text>
              <Text category="c1" style={styles.structureName}>{user?.structure?.name}</Text>
            </View>
          </TouchableOpacity>
        </Flex>
        <Text category="h6" style={styles.appName}>MONSTER</Text>
      </Flex>

      {/* Bottom Row: Action Icons */}
      <Flex align="center" justify="end" gap={15}>
        <TouchableOpacity style={styles.iconButton}>
          <HelpCircle size={24} color={COLORS.textDark} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => dispatch(NAVIGATE_TO_NOTIFICATIONS())}
        >
          <Bell size={24} color={COLORS.textDark} />
          <NotificationBadge size="tiny" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onRefresh} disabled={isLoading} activeOpacity={0.7}>
          <View style={[styles.iconButton, isLoading && styles.loadingButton]}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <RefreshCw size={24} color={COLORS.textDark} />
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
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  structureName: {
    color: COLORS.textLight,
  },
  appName: {
    color: '#1A2138',
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingButton: {
    opacity: 0.8,
  }
});
