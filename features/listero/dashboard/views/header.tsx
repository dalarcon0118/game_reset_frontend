import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Bell, HelpCircle, Eye, EyeOff, User } from 'lucide-react-native';
import { Label, Flex } from '../../../../shared/components';
import { useAuth } from '../../../../features/auth';
import { COLORS } from '../../../../shared/components/constants';
import { useDashboardStore } from '../core/store';
import { 
  HELP_CLICKED, 
  NOTIFICATIONS_CLICKED, 
  SETTINGS_CLICKED, 
  TOGGLE_BALANCE,
  REFRESH_CLICKED 
} from '../core/msg';

interface HeaderProps {
  onRefresh: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  const { user } = useAuth();
  const showBalance = useDashboardStore((state) => state.model.showBalance);
  const dispatch = useDashboardStore((state) => state.dispatch);

  return (
    <View style={styles.container}>
      {/* Top Row: User Info and MONSTER Logo */}
      <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 15 }]}>
        <Flex align="center" gap={10}>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => dispatch(SETTINGS_CLICKED())}
            activeOpacity={0.7}
          >
            <User size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View>
            <Flex align="center" gap={4}>
              <Label type="subheader" style={styles.welcomeText}>Hola,</Label>
              <Label type="header" style={styles.userName}>{user?.username || 'Usuario'}</Label>
            </Flex>
            <Label type="subheader" style={styles.structureName}>{user?.structure?.name || 'Mi Estructura'}</Label>
          </View>
        </Flex>
        <Label type="header" style={styles.appName}>MONSTER</Label>
      </Flex>

      {/* Action Icons Row */}
      <Flex justify="end" align="center" gap={16}>
        <TouchableOpacity 
          onPress={() => dispatch(HELP_CLICKED())} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <HelpCircle size={22} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => dispatch(NOTIFICATIONS_CLICKED())} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Bell size={22} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => dispatch(TOGGLE_BALANCE())} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          {showBalance ? (
            <Eye size={22} color={COLORS.textLight} />
          ) : (
            <EyeOff size={22} color={COLORS.textLight} />
          )}
        </TouchableOpacity>
      </Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  structureName: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: -2,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  }
});
