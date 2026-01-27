import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Bell, HelpCircle, Eye, EyeOff, Search, User } from 'lucide-react-native';
import { Input, Text } from '@ui-kitten/components';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { NotificationBadge } from '@/features/notification/components/notification_badge';
import { useDashboardStore, selectDashboardModel, selectDashboardDispatch } from '../core';
import { TOGGLE_BALANCE, NAVIGATE_TO_NOTIFICATIONS, NAVIGATE_TO_SETTINGS } from '../core/msg';
import { Model } from '../core/model';

interface DashboardHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ isLoading, onRefresh }: DashboardHeaderProps) {
  const model = useDashboardStore(selectDashboardModel) as Model;
  const dispatch = useDashboardStore(selectDashboardDispatch);
  const { user, showBalance } = model;

  return (
    <View style={styles.container}>
      {/* Top Row: User Info and App Name */}
      <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 15 }]}>
        <Flex align="center" gap={10}>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => dispatch(NAVIGATE_TO_SETTINGS())}
            activeOpacity={0.7}
          >
            <User size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View>
            <Text category="s1" style={styles.userName}>{user?.username || 'Usuario'}</Text>
            <Text category="c1" style={styles.structureName}>{user?.structure?.name}</Text>
          </View>
        </Flex>
        <Text category="h6" style={styles.appName}>MONSTER</Text>
      </Flex>

      {/* Bottom Row: Search and Action Icons */}
      <Flex align="center" gap={10}>
          
          <View style={styles.searchInput} ></View>
           {/* <Input
          placeholder="¿Cómo te puedo ayudar?"
          style={styles.searchInput}
          accessoryLeft={(props: any) => (
          <Search 
              {...props} 
              size={20} 
              color={COLORS.textLight} 
              style={props?.style} 
            />
          )}
          size="medium"
        />*/}
        <Flex align="center" gap={15}>
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

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => dispatch(TOGGLE_BALANCE())}
          >
            {showBalance ? (
              <Eye size={24} color={COLORS.textDark} />
            ) : (
              <EyeOff size={24} color={COLORS.textDark} />
            )}
          </TouchableOpacity>
        </Flex>
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
    fontWeight: '700',
    color: COLORS.textDark,
  },
  structureName: {
    color: COLORS.textLight,
  },
  appName: {
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.textDark,
  },
  searchInput: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: '#F0F2F5',
    borderWidth: 0,
  },
  iconButton: {
    position: 'relative',
    padding: 5,
  },
});
