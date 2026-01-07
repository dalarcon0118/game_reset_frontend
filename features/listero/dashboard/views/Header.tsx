import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Label, Flex } from '../../../../shared/components';
import { useAuth } from '../../../../features/auth';
import { User, LogOut, RefreshCw } from 'lucide-react-native';

interface HeaderProps {
  onRefresh: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <Flex justify="between" align="center" style={styles.container}>
      <Flex align="center" gap={12}>
        <View style={styles.userIconContainer}>
          <User size={20} color="#2E3A59" />
        </View>
        <View>
          <Label type="header" style={styles.welcome}>Hola,</Label>
          <Label style={styles.userName}>{user?.username || 'Usuario'}</Label>
        </View>
      </Flex>
      
      <Flex align="center" gap={16}>
        <TouchableOpacity 
          onPress={onRefresh} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <RefreshCw size={22} color="#8F9BB3" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={logout} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <LogOut size={22} color="#FF3D71" />
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    marginTop: 20,
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  welcome: {
    fontSize: 14,
    color: '#8F9BB3',
    marginBottom: -2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E3A59',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7F9FC',
  }
});