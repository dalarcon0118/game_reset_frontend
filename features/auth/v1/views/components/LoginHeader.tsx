import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
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

export const LoginHeader = ({
  username,
  onUsernameUpdate,
  isEditing,
  setIsEditing
}: LoginHeaderProps) => {
  const [tempUsername, setTempUsername] = useState(username);

  useEffect(() => {
    setTempUsername(username);
  }, [username]);

  const handleSubmit = () => {
    if (tempUsername.trim()) {
      onUsernameUpdate(tempUsername.trim());
    } else {
        setIsEditing(false);
    }
  };

  return (
    <Flex vertical align="center" style={{ marginTop: 60 }} gap={16}>
      <View style={styles.iconContainer}>
        <Lock size={32} color={THEME.accent} />
      </View>
      <Text category="h4" style={{ color: THEME.text }}>Game-Reset</Text>

      {isEditing ? (
        <View style={{ width: 250, alignItems: 'center' }}>
          <Input
            value={tempUsername}
            onChangeText={setTempUsername}
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
};
