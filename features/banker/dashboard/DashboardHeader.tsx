import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Calendar, RefreshCw, User } from 'lucide-react-native';
import { MenuItem, OverflowMenu } from '@ui-kitten/components';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { useAuth } from '../../auth';
import { es } from '../../language/es';

interface DashboardHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ isLoading, onRefresh }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const renderMenuAnchor = () => (
    <TouchableOpacity onPress={toggleMenu} activeOpacity={0.7}>
      <View style={styles.iconButton}>
        <User size={20} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Flex justify="between" align="center" margin={[{ type: "horizontal", value: 20 }, { type: "top", value: 20 }, { type: "bottom", value: 10 }]}>
      <Flex vertical gap={4}>
        <Label type="title" style={{ fontSize: 28, color: COLORS.primary }}>
          {user?.structure?.name || es.banker.dashboard.header.bank}
        </Label>
        <Flex align="center" gap={8}>
          <Label type="subheader" style={{ color: COLORS.textLight, fontWeight: 'normal' }}>
            {user?.username}
          </Label>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textLight }} />
          <Flex align="center" gap={6}>
             <Calendar size={14} color={COLORS.textLight} />
             <Label type="date" value={formatDate()} style={{ fontSize: 12 }} />
          </Flex>
        </Flex>
      </Flex>

      <Flex align="center" gap={12}>
        <TouchableOpacity onPress={onRefresh} disabled={isLoading} activeOpacity={0.7}>
          <View style={[styles.iconButton, isLoading && styles.loadingButton]}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <RefreshCw size={20} color={COLORS.primary} />
            )}
          </View>
        </TouchableOpacity>

        <OverflowMenu
          anchor={renderMenuAnchor}
          visible={menuVisible}
          onBackdropPress={toggleMenu}
        >
          <MenuItem title={es.banker.dashboard.header.logout} onPress={() => {
            toggleMenu();
            logout();
          }} />
        </OverflowMenu>
      </Flex>
    </Flex>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingButton: {
    opacity: 0.8,
  }
});
