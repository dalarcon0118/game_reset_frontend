import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/shared/hooks/use_theme';
import { IconButton, NotificationBadge } from '@/shared/components';
import { withAlpha } from '@/shared/utils/color';
import { Eye, EyeOff, HelpCircle, User, RefreshCw } from 'lucide-react-native';

interface ActionBarProps {
  rewardsCount?: number;
  rewardsError?: boolean;
  unreadCount?: number;
  onRewardsCountPress?: () => void;
  onNotificationPress?: () => void;
  onHelpPress?: () => void;
  onSettingsPress?: () => void;
  showBalance?: boolean;
  onToggleBalance?: () => void;
  onSyncPress?: () => void;
  isSyncing?: boolean;
}


export const ActionBar: React.FC<ActionBarProps> = React.memo(
  ({
    unreadCount = 0,
    onNotificationPress,
    onHelpPress,
    onSettingsPress,
    showBalance = false,
    onToggleBalance,
    onSyncPress,
    isSyncing = false,
  }) => {
    const { colors } = useTheme();

    return (
      <View style={styles.container}>
        {onToggleBalance && (
          <IconButton
            onPress={onToggleBalance}
            accessibilityLabel={showBalance ? 'Ocultar balance' : 'Mostrar balance'}
            style={styles.toggleButton}
          >
            {showBalance ? (
              <EyeOff size={16} color={colors.textTertiary} />
            ) : (
              <Eye size={16} color={colors.textTertiary} />
            )}
          </IconButton>
        )}
        {onSyncPress ? (
          <IconButton
            onPress={onSyncPress}
            accessibilityLabel="Sincronizar datos"
            disabled={isSyncing}
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          >
            {isSyncing ? (
              <ActivityIndicator size={16} color={colors.primary} />
            ) : (
              <RefreshCw size={18} color={colors.textTertiary} />
            )}
          </IconButton>
        ) : null}
        <NotificationBadge
          unreadCount={unreadCount}
          onPress={onNotificationPress}
          iconColor={colors.primary}
          backgroundColor={colors.backgroundSecondary}
          badgeColor={colors.error}
        />
        {onHelpPress ? (
          <IconButton
            onPress={onHelpPress}
            accessibilityLabel="Ayuda"
            style={styles.helpButton}
          >
            <HelpCircle size={22} color={colors.textTertiary} />
          </IconButton>
        ) : null}
        <IconButton
          onPress={onSettingsPress}
          accessibilityLabel="Configuración"
          style={[styles.profileIcon, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <User size={22} color={colors.primary} />
        </IconButton>
      </View>
    );
  },
);

ActionBar.displayName = 'ActionBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleButton: {
    padding: 4,
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
  helpButton: {
    padding: 4,
  },
  syncButton: {
    padding: 4,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
});

export default ActionBar;