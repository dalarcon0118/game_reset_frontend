import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Text, Input, Button } from '@ui-kitten/components';
import { Lock, Edit2 } from 'lucide-react-native';
import { Flex } from '@/shared/components';
import { THEME } from '../login.styles';
import Constants from 'expo-constants';
import { getAppVersion } from '@/shared/utils/app_version';
import { LoginMetrics } from '../../hooks/use_responsive_login';




interface LoginHeaderProps {
  username: string;
  onUsernameUpdate: (name: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  metrics: LoginMetrics;
  styles: any;
}

export const LoginHeader = React.memo(({
  username,
  onUsernameUpdate,
  isEditing,
  setIsEditing,
  metrics,
  styles
}: LoginHeaderProps) => {
  const [tempUsername, setTempUsername] = useState(username);

  useEffect(() => {
    setTempUsername(username);
  }, [username]);

  const sanitizeUsername = useCallback((text: string): string => {
    return text.replace(/\s+/g, '').trim();
  }, []);

  const handleUsernameChange = useCallback((text: string) => {
    const sanitized = sanitizeUsername(text);
    setTempUsername(sanitized);
  }, [sanitizeUsername]);

  const handleSubmit = () => {
    const trimmed = tempUsername.trim();
    if (!trimmed) {
      Alert.alert('Usuario inválido', 'El nombre de usuario no puede estar vacío.');
      return;
    }
    if (trimmed.length < 3) {
      Alert.alert('Usuario inválido', 'El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    onUsernameUpdate(trimmed);
  };

  return (
    <Flex vertical align="center" gap={8}>
      <View style={styles.iconContainer}>
        <Lock size={metrics.iconSize} color={THEME.accent} />
      </View>
      <Text category="h4" style={{ color: THEME.text }}>Game-Reset</Text>
      <Text category="s1" style={{ color: THEME.textSecondary }}>{getAppVersion()}</Text>
      {isEditing ? (
        <View style={styles.inputContainer}>
          <Input
            value={tempUsername}
            onChangeText={handleUsernameChange}
            placeholder="Usuario"
            autoCapitalize="none"
            status="control"
            style={styles.headerInput}
            textStyle={{ color: 'white' }}
            onFocus={() => console.log('LoginHeader Input: focused')}
            onBlur={() => console.log('LoginHeader Input: blurred')}
            autoFocus={true}
          />
          <View style={styles.headerButtons}>
            <Button
              size="small"
              appearance="ghost"
              status="basic"
              onPress={() => setIsEditing(false)}
              style={{ flex: 1 }}
            >
              Cancelar
            </Button>
            <Button
              size="small"
              status="primary"
              onPress={handleSubmit}
              style={{ flex: 1 }}
            >
              OK
            </Button>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={styles.userBadge}
        >
          <Text category="s1" style={{ color: THEME.textSecondary }}>
            Hola,{' '}
            <Text category="s1" style={{ color: THEME.text, fontWeight: 'bold' }}>
              {username || 'Invitado'}
            </Text>
          </Text>
          <Edit2 size={14} color={THEME.textSecondary} />
        </TouchableOpacity>
      )}
    </Flex>
  );
});
LoginHeader.displayName = 'LoginHeader';