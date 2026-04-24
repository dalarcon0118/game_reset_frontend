import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text as KittenText } from '@ui-kitten/components';
import { Menu, Bell, User, Circle, Wifi, WifiOff } from 'lucide-react-native';
import Colors from '@/constants/colors';

const COLORS = Colors.light;

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
    rewardsCount?: number;
    rewardsError?: boolean;
}

export type { HeaderProps };

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
    rewardsCount = 0,
    rewardsError = false 
}) => {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    return (
        <View style={[styles.container, { 
            backgroundColor: theme.background, 
            borderBottomColor: theme.border 
        }]}>
            <View style={styles.leftSection}>
                <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
                    <Menu size={24} color={theme.text} />
                </TouchableOpacity>
                
                <View style={styles.userInfo}>
                    <KittenText style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                        {username}
                    </KittenText>
                    <View style={styles.structureRow}>
                        <KittenText style={[styles.structureName, { color: theme.textSecondary }]} numberOfLines={1}>
                            {structureName}
                        </KittenText>
                        {isOnline && (
                            <Wifi size={12} color={theme.success} style={styles.onlineIcon} />
                        )}
                    </View>
                </View>
            </View>
            
            <View style={styles.rightContainer}>
                {(rewardsCount > 0 || rewardsError) && (
                    <TouchableOpacity 
                        onPress={onRewardsCountPress} 
                        style={[
                            styles.rewardsBadge, 
                            { backgroundColor: rewardsError ? theme.error + '20' : theme.primary + '15' }
                        ]}
                    >
                        <Text style={[
                            styles.rewardsText, 
                            { color: rewardsError ? theme.error : theme.primary }
                        ]}>
                            {rewardsError ? '↻' : `${rewardsCount} premios`}
                        </Text>
                    </TouchableOpacity>
                )}
                <View style={[styles.bellButton, { backgroundColor: theme.backgroundSecondary }]}>
                    <TouchableOpacity onPress={onNotificationPress}>
                        <View style={styles.bellContent}>
                            <Bell size={22} color={theme.primary} />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: theme.error }]}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                
                <View style={[styles.profileIcon, { 
                    backgroundColor: theme.backgroundSecondary, 
                    borderColor: theme.border 
                }]}>
                    <TouchableOpacity onPress={onSettingsPress}>
                        <User size={22} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
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
    rightContainer: {
        flexDirection: 'row',
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