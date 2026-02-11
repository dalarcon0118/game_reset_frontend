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
      <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 12 }]}>
        <Flex align="center" gap={10}>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={() => dispatch(SETTINGS_CLICKED())}
            activeOpacity={0.7}
          >
            <User size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View>
            <Flex align="baseline" gap={6}>
              <Label type="detail" style={styles.welcomeText}>Hola,</Label>
              <Label type="header" style={styles.userName}>{user?.username || 'Usuario'}</Label>
            </Flex>
            <Label type="subheader" style={styles.structureName}>{user?.structure?.name || 'Mi Estructura'}</Label>
          </View>
        </Flex>
        <Label type="subheader" style={styles.appName}>MONSTER</Label>
      </Flex>

      {/* Action Icons Row */}
      <Flex justify="end" align="center" gap={12} style={styles.actionRow}>
        <TouchableOpacity 
          onPress={() => dispatch(HELP_CLICKED())} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <HelpCircle size={20} color={COLORS.textDark} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => dispatch(NOTIFICATIONS_CLICKED())} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Bell size={20} color={COLORS.textDark} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => dispatch(TOGGLE_BALANCE())} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          {showBalance ? (
            <Eye size={20} color={COLORS.textDark} />
          ) : (
            <EyeOff size={20} color={COLORS.textDark} />
          )}
        </TouchableOpacity>
      </Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  structureName: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  actionRow: {
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
