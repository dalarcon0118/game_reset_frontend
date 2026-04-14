import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Text, Input, Button } from '@ui-kitten/components';
import { Lock, Edit2 } from 'lucide-react-native';
import { Flex } from '@/shared/components';
import { THEME, styles } from '../login.styles';

interface LoginHeaderProps {
  username: string;
  onUsernameUpdate: (name: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

export const LoginHeader = React.memo(({
  username,
  onUsernameUpdate,
  isEditing,
  setIsEditing
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
    <Flex vertical align="center" style={{ marginTop: 60 }} gap={10}>
      <View style={styles.iconContainer}>
        <Lock size={32} color={THEME.accent} />
      </View>
      <Text category="h4" style={{ color: THEME.text }}>Game-Reset</Text>

      {isEditing ? (
        <View style={{ width: 250, alignItems: 'center' }}>
          <Input
            value={tempUsername}
            onChangeText={handleUsernameChange}
            placeholder="Usuario"
            autoCapitalize="none"
            status="control"
            style={styles.headerInput}
            textStyle={{ color: 'white' }}
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
