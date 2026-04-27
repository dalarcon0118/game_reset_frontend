import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/hooks/use_theme';
import Constants from 'expo-constants';
import { Flex } from '@/shared/components';
import { getAppVersion } from '@/shared/utils/app_version';


interface AppBrandProps {
  showBalance?: boolean;
  onToggleBalance?: () => void;
}

export const AppBrand: React.FC<AppBrandProps> = React.memo(
  ({ showBalance = true, onToggleBalance }) => {
    const { colors } = useTheme();

    return (
       <Flex
            vertical
            gap={12}
            style={styles.container}>
              <Flex vertical>
                        <Text style={[styles.appName, { color: colors.success }]}>GAME-RESET</Text>
              </Flex>
              <Flex vertical>
                <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
                {getAppVersion() || 'N/A.0.0'}
              </Text>
              </Flex>
            </Flex>
      
    );
  },
);

AppBrand.displayName = 'AppBrand';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AppBrand;