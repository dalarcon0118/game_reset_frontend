import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Input, Button } from '@ui-kitten/components';
import { Delete, User, Lock, Edit2 } from 'lucide-react-native';
import { COLORS } from '@/shared/components/constants';
import { useAuth } from '../hooks/use_auth';
import { useAuthStore, selectAuthDispatch } from '../store/store';
import { AuthMsgType } from '../store/types';
import { Flex } from '@/shared/components';

// Custom dark theme colors for this screen
const THEME = {
  background: '#141414', // Very dark/black
  text: '#FFFFFF',
  textSecondary: '#8F9BB3',
  dotEmpty: '#333333',
  dotFilled: '#FFFFFF',
  keypadText: '#FFFFFF',
  keypadPressed: '#333333',
  accent: COLORS.primary, // #00C48C
};

export default function LoginScreen() {
  const {
    loginSession,
    isLoading,
    error,
    login,
    updateUsername,
    updatePin
  } = useAuth();
  const dispatch = useAuthStore(selectAuthDispatch);

  // Local UI state (not part of TEA - just for component behavior)
  const [tempUsername, setTempUsername] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);

  useEffect(() => {
    if (loginSession.pin.length === 6) {
      handleLogin(loginSession.pin);
    }
  }, [loginSession.pin]);

  const handleLogin = async (currentPin: string) => {
    // TEA: Dispatch login action (handled by TEA store)
    login(loginSession.username, currentPin);
  };

  const handleUsernameSubmit = () => {
    if (tempUsername.trim()) {
      // TEA: Dispatch username update
      updateUsername(tempUsername.trim());
      setIsEditingUser(false);
    }
  };

  const handlePress = (val: string) => {
    // TEA: Dispatch PIN update (limited to 6 digits)
    if (loginSession.pin.length < 6) {
      updatePin(loginSession.pin + val);
    }
  };

  const handleDelete = () => {
    // TEA: Dispatch PIN update (remove last digit)
    updatePin(loginSession.pin.slice(0, -1));
  };

  const renderDot = (index: number) => {
    const isFilled = index < loginSession.pin.length;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: isFilled ? THEME.dotFilled : 'transparent',
            borderColor: isFilled ? THEME.dotFilled : THEME.dotEmpty,
          }
        ]}
      />
    );
  };

  const renderKey = (val: string) => (
    <TouchableOpacity
      style={[styles.key, { opacity: isLoading ? 0.3 : 1 }]}
      onPress={() => handlePress(val)}
      activeOpacity={0.5}
      disabled={isLoading}
    >
      <Text style={styles.keyText}>{val}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Flex flex={1} vertical justify="between" align="center" padding="xl">
        <Flex vertical align="center" style={{ marginTop: 60 }} gap={16}>
             <View style={styles.iconContainer}>
               <Lock size={32} color={THEME.accent} />
             </View>
             <Text category="h4" style={{ color: THEME.text }}>Game-Reset</Text>
             
             {isEditingUser ? (
                 <View style={{ width: 250, alignItems: 'center' }}>
                    <Input
                        value={tempUsername}
                        onChangeText={setTempUsername}
                        placeholder="Usuario"
                        autoCapitalize="none"
                        status="control"
                        style={{ marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'transparent' }}
                        textStyle={{ color: 'white' }}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10 }}>
                        <Button 
                            size="small" 
                            appearance="ghost" 
                            status="basic" 
                            onPress={() => setIsEditingUser(false)}
                            style={{ flex: 1 }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            size="small" 
                            status="primary" 
                            onPress={handleUsernameSubmit}
                            style={{ flex: 1 }}
                        >
                            OK
                        </Button>
                    </View>
                 </View>
             ) : (
                 <TouchableOpacity
                    onPress={() => {
                        setTempUsername(loginSession.username);
                        setIsEditingUser(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 }}
                 >
                    <Text category="s1" style={{ color: THEME.textSecondary }}>
                        Hola,{' '}
                        <Text category="s1" style={{ color: THEME.text, fontWeight: 'bold' }}>
                            {loginSession.username}
                        </Text>
                    </Text>
                    <Edit2 size={14} color={THEME.textSecondary} />
                 </TouchableOpacity>
             )}
        </Flex>

        <Flex vertical align="center" gap={40} style={{ width: '100%' }}>
          <View style={{ height: 24, justifyContent: 'center' }}>
            {isLoading ? (
              <ActivityIndicator color={THEME.accent} />
            ) : error ? (
              <Text status="danger" category="p2">{error}</Text>
            ) : (
              <Text category="p1" style={{ color: THEME.text, fontSize: 18 }}>Ingresa el PIN de acceso</Text>
            )}
          </View>
          
          <Flex vertical={false} gap={24}>
            {[0, 1, 2, 3, 4, 5].map(renderDot)}
          </Flex>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => dispatch({ type: AuthMsgType.FORGOT_PIN_REQUESTED })}
          >
            <Text style={styles.forgotPin}>¿Olvidaste tu PIN?</Text>
          </TouchableOpacity>
        </Flex>

        {/* Bottom Section: Keypad */}
        <View style={styles.keypadContainer}>
          <View style={styles.row}>
            {renderKey('1')}
            {renderKey('2')}
            {renderKey('3')}
          </View>
          <View style={styles.row}>
            {renderKey('4')}
            {renderKey('5')}
            {renderKey('6')}
          </View>
          <View style={styles.row}>
            {renderKey('7')}
            {renderKey('8')}
            {renderKey('9')}
          </View>
          <View style={styles.row}>
            <View style={styles.key} />
            {renderKey('0')}
            <TouchableOpacity
              style={[styles.key, { opacity: isLoading ? 0.3 : 1 }]}
              onPress={handleDelete}
              activeOpacity={0.5}
              disabled={isLoading}
            >
              <Delete size={28} color={THEME.text} />
            </TouchableOpacity>
          </View>
        </View>

      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 196, 140, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  keypadContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
    maxWidth: 400,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    marginBottom: 24,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 28,
    color: THEME.keypadText,
    fontWeight: '300',
  },
});
