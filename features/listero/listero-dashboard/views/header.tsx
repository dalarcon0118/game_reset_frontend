import React from 'react';
import { Menu } from 'lucide-react-native';
import { useTheme } from '@/shared/hooks/use_theme';
import { Flex, IconButton } from '@/shared/components';
import { UserInfo } from './components/header/user_info';
import { AppBrand } from './components/header/app_brand';
import { ActionBar } from './components/header/action_bar';

interface HeaderProps {
  username?: string;
  structureName?: string;
  isOnline?: boolean;
  showBalance?: boolean;
  unreadCount?: number;
  onMenuPress?: () => void;
  onHelpPress?: () => void;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
  onRewardsCountPress?: () => void;
  onToggleBalance?: () => void;
  onSyncPress?: () => void;
  isSyncing?: boolean;
  rewardsCount?: number;
  rewardsError?: boolean;
}

export type { HeaderProps };

export const Header: React.FC<HeaderProps> = React.memo(({
  username,
  structureName,
  isOnline = true,
  showBalance = true,
  unreadCount = 0,
  onMenuPress,
  onHelpPress,
  onNotificationPress,
  onSettingsPress,
  onRewardsCountPress,
  onToggleBalance,
  onSyncPress,
  isSyncing = false,
  rewardsCount = 0,
  rewardsError = false,
}) => {
  const { colors } = useTheme();

  return (
    <Flex
      vertical
      gap={12}
      padding={[
        { type: 'horizontal', value: 'xl' },
        { type: 'vertical', value: 'l' },
      ]}
      style={{
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      }}
    >
      <Flex justify="between" align="center">
        <IconButton onPress={onMenuPress} accessibilityLabel="Abrir menú">
          <Menu size={24} color={colors.text} />
        </IconButton>
        <AppBrand/>
      </Flex>

      

      <Flex justify="end" align="center">
        <UserInfo
        username={username}
        structureName={structureName}
        isOnline={isOnline}
      />
        <ActionBar
          showBalance={showBalance}
          onToggleBalance={onToggleBalance}
          rewardsCount={rewardsCount}
          rewardsError={rewardsError}
          unreadCount={unreadCount}
          onRewardsCountPress={onRewardsCountPress}
          onNotificationPress={onNotificationPress}
          onHelpPress={onHelpPress}
          onSettingsPress={onSettingsPress}
          onSyncPress={onSyncPress}
          isSyncing={isSyncing}
        />
      </Flex>
    </Flex>
  );
});

Header.displayName = 'Header';

export default Header;