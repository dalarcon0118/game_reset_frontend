import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text as KittenText } from '@ui-kitten/components';
import { useTheme } from '@/shared/hooks/use_theme';
import { ConnectionIndicator } from './connection_indicator';

interface UserInfoProps {
  username?: string;
  structureName?: string;
  isOnline?: boolean;
}

export const UserInfo: React.FC<UserInfoProps> = React.memo(
  ({ username, structureName, isOnline = true }) => {
    const { colors } = useTheme();

    return (
      <View style={styles.container}>
        <KittenText style={[styles.username, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
          {username}
        </KittenText>
        <View style={styles.structureRow}>
          <KittenText
            style={[styles.structureName, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {structureName}
          </KittenText>
          <ConnectionIndicator isOnline={isOnline} />
        </View>
      </View>
    );
  },
);

UserInfo.displayName = 'UserInfo';

const styles = StyleSheet.create({
  container: {
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
});

export default UserInfo;