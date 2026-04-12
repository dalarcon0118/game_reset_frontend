import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { Bell, HelpCircle, Eye, EyeOff, User, WifiOff } from 'lucide-react-native';
import { Label, Flex, Badge } from '@/shared/components';
import { COLORS } from '@/shared/components/constants';

interface HeaderProps {
  username: string;
  structureName: string;
  isOnline: boolean;
  showBalance: boolean;
  unreadCount: number;
  pendingRewardsCount?: number;
  onHelp: () => void;
  onNotifications: () => void;
  onSettings: () => void;
  onToggleBalance: () => void;
}

const PulseDot = ({ isOnline }: { isOnline: boolean }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  return (
    <View style={styles.statusDotContainer}>
      <Animated.View 
        style={[
          styles.statusDot, 
          { 
            backgroundColor: isOnline ? COLORS.success : COLORS.danger,
            opacity: pulseAnim 
          }
        ]} 
      />
    </View>
  );
};

export default function Header({ 
  username, 
  structureName, 
  isOnline,
  showBalance, 
  unreadCount,
  pendingRewardsCount = 0,
  onHelp,
  onNotifications,
  onSettings,
  onToggleBalance
}: HeaderProps) {
  
  const formatBadgeCount = (count: number): string | null => {
    if (count <= 0) return null;
    return count > 99 ? '99+' : count.toString();
  };

  const notificationBadge = formatBadgeCount(unreadCount);
  const rewardsBadge = formatBadgeCount(pendingRewardsCount);

  return (
    <View style={styles.container}>
      {!isOnline && (
        <Flex align="center" justify="center" gap={6} style={styles.offlineBanner}>
          <WifiOff size={14} color={COLORS.danger} />
          <Label style={styles.offlineText}>Sin conexión - Modo lectura</Label>
        </Flex>
      )}

      {/* Top Row: User Info and MONSTER Logo */}
      <Flex justify="between" align="center" margin={[{ type: 'bottom', value: 12 }]}>
        <Flex align="center" gap={10}>
          <TouchableOpacity 
            style={styles.profileIcon}
            onPress={onSettings}
            activeOpacity={0.7}
          >
            <User size={28} color={COLORS.primary} />
            <PulseDot isOnline={isOnline} />
          </TouchableOpacity>
          <View>
            <Flex align="baseline" gap={6}>
              <Label type="detail" style={styles.welcomeText}>Hola,</Label>
              <Label type="header" style={styles.userName}>{username}</Label>
            </Flex>
            <Label type="subheader" style={styles.structureName}>{structureName}</Label>
          </View>
        </Flex>
        <Label type="subheader" style={styles.appName}>MONSTER</Label>
      </Flex>

      {/* Action Icons Row */}
      <Flex justify="end" align="center" gap={12} style={styles.actionRow}>
        <TouchableOpacity 
          onPress={onHelp} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <HelpCircle size={20} color={COLORS.textDark} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onNotifications} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <View>
            <Bell size={20} color={COLORS.textDark} />
            {notificationBadge && (
              <Badge 
                content={notificationBadge}
                color={COLORS.danger}
                textColor="#FFF"
                style={styles.notificationBadge}
              />
            )}
            {rewardsBadge && (
              <Badge 
                content={rewardsBadge}
                color={COLORS.success}
                textColor="#FFF"
                style={styles.rewardsBadge}
              />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onToggleBalance} 
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 2,
  },
  rewardsBadge: {
    position: 'absolute',
    bottom: -6,
    left: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 1,
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
  statusDotContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  offlineBanner: {
    backgroundColor: '#FFF2F2',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFDADA',
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
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
