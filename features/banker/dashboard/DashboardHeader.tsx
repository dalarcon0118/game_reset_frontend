import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, RefreshCw, User } from 'lucide-react-native';

import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components/flex';
import { Label } from '@/shared/components/label';
import { useAuth } from '@/shared/context/AuthContext';

interface DashboardHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ isLoading, onRefresh }: DashboardHeaderProps) {
  const { user, logout } = useAuth();

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Flex justify="between" align="center" margin={20} padding={[{ type:"top", value: 20 }]}>
      <Flex vertical align="center" gap={10}>
        <Label type="title" value={`${user?.structure?.name || 'Bank'} - ${user?.username}`} />
        <TouchableOpacity>
          <Flex align="center" gap={20} margin={[{ type: "left", value: -80 }]}>
            <Label type="date" value={formatDate()} />
            <Calendar size={16} color={COLORS.textLight} />
          </Flex>
        </TouchableOpacity>
      </Flex>
      <Flex align="center" gap={10}>
        <TouchableOpacity onPress={onRefresh} disabled={isLoading}>
          <Flex align="center" justify="center" padding="m" style={[styles.dateBadge, { borderRadius: 10 }]}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <RefreshCw size={20} color={COLORS.primary} />
            )}
          </Flex>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout}>
          <Flex align="center" justify="center" padding="m" style={[styles.dateBadge, { borderRadius: 10 }]}>
            <User size={20} color={COLORS.primary} />
          </Flex>
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
}

const styles = StyleSheet.create({
  dateBadge: {
    backgroundColor: '#FFFFFF',
  },
});
