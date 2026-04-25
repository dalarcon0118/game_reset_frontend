import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Text as KittenText } from '@ui-kitten/components';
import { Menu, Bell, User, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/shared/hooks/use_theme';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convierte hex (#RRGGBB) a rgba. RN no soporta #RRGGBBAA. */
const withAlpha = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatBadgeCount = (count: number): string => (count > 9 ? '9+' : String(count));

// ─── Types ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  username?: string;
  structureName?: string;
  isOnline?: boolean;
  showBalance?: boolean;
  unreadCount?: number;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onHelpPress?: () => void;
  onSettingsPress?: () => void;
  onRewardsCountPress?: () => void;
  onToggleBalance?: () => void;
  rewardsCount?: number;
  rewardsError?: boolean;
}

export type { HeaderProps };

// ─── Sub-components ─────────────────────────────────────────────────────────
// Cada uno encapsula UNA responsabilidad visual → bajo costo cognitivo

const IconButton: React.FC<{
  onPress?: () => void;
  label: string;
  style?: any;
  children: React.ReactNode;
}> = ({ onPress, label, style, children }) => (
  <TouchableOpacity
    onPress={onPress}
    style={style}
    accessibilityLabel={label}
    accessibilityRole="button"
  >
    {children}
  </TouchableOpacity>
);

const ConnectionIndicator: React.FC<{ isOnline: boolean; color: { success: string; error: string } }> = ({
  isOnline,
  color,
}) =>
  isOnline ? (
    <Wifi size={12} color={color.success} style={styles.onlineIcon} />
  ) : (
    <WifiOff size={12} color={color.error} style={styles.onlineIcon} />
  );

const BalanceToggle: React.FC<{
  visible: boolean;
  onPress?: () => void;
  color: string;
}> = ({ visible, onPress, color }) => {
  if (!onPress) return null;
  const Icon = visible ? EyeOff : Eye;
  return (
    <IconButton onPress={onPress} label={visible ? 'Ocultar balance' : 'Mostrar balance'} style={styles.balanceToggle}>
      <Icon size={16} color={color} />
    </IconButton>
  );
};

const NotificationBell: React.FC<{
  unreadCount: number;
  onPress?: () => void;
  color: { primary: string; backgroundSecondary: string; error: string };
}> = ({ unreadCount, onPress, color }) => (
  <IconButton
    onPress={onPress}
    label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
    style={[styles.bellButton, { backgroundColor: color.backgroundSecondary }]}
  >
    <View style={styles.bellContent}>
      <Bell size={22} color={color.primary} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: color.error }]}>
          <Text style={styles.badgeText}>{formatBadgeCount(unreadCount)}</Text>
        </View>
      )}
    </View>
  </IconButton>
);

const RewardsBadge: React.FC<{
  count: number;
  hasError: boolean;
  onPress?: () => void;
  color: { primary: string; error: string };
}> = ({ count, hasError, onPress, color }) => {
  if (count <= 0 && !hasError) return null;

  const label = hasError ? 'Reintentar carga de premios' : `${count} premios pendientes`;
  const textColor = hasError ? color.error : color.primary;
  const bgColor = hasError ? withAlpha(color.error, 0.12) : withAlpha(color.primary, 0.08);
  const displayText = hasError ? '↻' : `${count} premios`;

  return (
    <IconButton onPress={onPress} label={label} style={[styles.rewardsBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.rewardsText, { color: textColor }]}>{displayText}</Text>
    </IconButton>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const Header: React.FC<HeaderProps> = ({
  username,
  structureName,
  isOnline = true,
  showBalance = true,
  unreadCount = 0,
  onMenuPress,
  onNotificationPress,
  onHelpPress,
  onSettingsPress,
  onRewardsCountPress,
  onToggleBalance,
  rewardsCount = 0,
  rewardsError = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {/* UserInfo + App branding */}
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <IconButton onPress={onMenuPress} label="Abrir menú" style={styles.menuButton}>
            <Menu size={24} color={colors.text} />
          </IconButton>

          <View style={styles.userInfo}>
            <KittenText style={[styles.username, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {username}
            </KittenText>
            <View style={styles.structureRow}>
              <KittenText style={[styles.structureName, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {structureName}
              </KittenText>
              <ConnectionIndicator isOnline={isOnline} color={{ success: colors.success, error: colors.error }} />
            </View>
          </View>
        </View>

        <View style={styles.appNameContainer}>
          <Text style={[styles.appName, { color: colors.success }]}>GAME RESET</Text>
          <BalanceToggle visible={showBalance} onPress={onToggleBalance} color={colors.textTertiary} />
        </View>
      </View>

      {/* Actions row */}
      <View style={styles.bottomRow}>
        <RewardsBadge
          count={rewardsCount}
          hasError={rewardsError}
          onPress={onRewardsCountPress}
          color={{ primary: colors.primary, error: colors.error }}
        />
        <NotificationBell
          unreadCount={unreadCount}
          onPress={onNotificationPress}
          color={{ primary: colors.primary, backgroundSecondary: colors.backgroundSecondary, error: colors.error }}
        />
        <IconButton
          onPress={onSettingsPress}
          label="Configuración"
          style={[styles.profileIcon, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <User size={22} color={colors.primary} />
        </IconButton>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 4,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  structureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  structureName: {
    fontSize: 12,
    marginRight: 4,
  },
  onlineIcon: {
    marginLeft: 2,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceToggle: {
    padding: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellContent: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  rewardsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardsText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Header;