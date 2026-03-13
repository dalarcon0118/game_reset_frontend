import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Text, Input, Button } from '@ui-kitten/components';
import { Lock, Edit2 } from 'lucide-react-native';
import { COLORS } from '@/shared/components/constants';
import { Flex } from '@/shared/components';
import { useAuthV1 } from '../hooks/use_auth';

import { logger } from '@/shared/utils/logger';

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

const log = logger.withTag('LOGIN_VIEW');

export default function LoginScreen() {
  const {
    loginSession,
    isAuthenticating,
    isHydrating,
    status,
    error,
    login,
    updateUsername,
    updatePin,
    dispatch
  } = useAuthV1();

  // Log estado inicial al montar el componente
  useEffect(() => {
    log.info('LoginScreen montado - Estado inicial', { 
      loginSession, 
      status, 
      isAuthenticating, 
      isHydrating,
      timestamp: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    log.debug('Auth state updated in LoginScreen', { status, isAuthenticating, isHydrating, loginSession });
  }, [status, isAuthenticating, isHydrating, loginSession]);

  // Local UI state (not part of TEA - just for component behavior)
  const [tempUsername, setTempUsername] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);

  useEffect(() => {
    log.debug('useEffect login trigger ejecutándose', { 
      pinLength: loginSession.pin.length, 
      isAuthenticating, 
      isHydrating,
      pinValue: loginSession.pin,
      willTrigger: loginSession.pin.length === 6 && !isAuthenticating && !isHydrating
    });
    
    if (loginSession.pin.length === 6 && !isAuthenticating && !isHydrating) {
      log.info('Disparando login automático - PIN de 6 dígitos detectado', { 
        username: loginSession.username,
        pinLength: loginSession.pin.length 
      });
      handleLogin(loginSession.pin);
    }
  }, [loginSession.pin, isAuthenticating, isHydrating]);

  const handleLogin = async (currentPin: string) => {
    log.info('handleLogin ejecutándose', { 
      username: loginSession.username, 
      pinLength: currentPin.length,
      hasUsername: !!loginSession.username 
    });
    
    if (!loginSession.username) {
      log.warn('Login bloqueado: falta username');
      setIsEditingUser(true);
      return;
    }
    // TEA: Dispatch login action (handled by TEA store)
    log.info('Disparando LOGIN_REQUESTED al TEA store', { username: loginSession.username });
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
    log.debug('handlePress ejecutándose', { val, isKeypadDisabled, currentPinLength: loginSession.pin.length });
    if (isKeypadDisabled) {
      log.warn('Tecla presionada pero keypad deshabilitado');
      return;
    }
    // TEA: Dispatch PIN update (limited to 6 digits)
    if (loginSession.pin.length < 6) {
      const newPin = loginSession.pin + val;
      log.info('Actualizando PIN', { previousPin: loginSession.pin, newPin, newLength: newPin.length });
      updatePin(newPin);
    } else {
      log.warn('PIN ya tiene 6 dígitos, ignorando tecla');
    }
  };

  const handleDelete = () => {
    if (isKeypadDisabled) return;
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

  const isKeypadDisabled = isAuthenticating || isHydrating || isEditingUser;

  const renderKey = (val: string) => (
    <TouchableOpacity
      style={[styles.key, { opacity: isKeypadDisabled ? 0.3 : 1 }]}
      onPress={() => handlePress(val)}
      activeOpacity={0.5}
      disabled={isKeypadDisabled}
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
                            {loginSession.username || 'invitado'}
                        </Text>
                    </Text>
                    <Edit2 size={14} color={THEME.textSecondary} />
                 </TouchableOpacity>
             )}
        </Flex>

        <Flex vertical align="center" gap={40} style={{ width: '100%' }}>
          <View style={{ height: 40, justifyContent: 'center', width: '100%', alignItems: 'center', paddingHorizontal: 20 }}>
            {isAuthenticating || isHydrating ? (
              <ActivityIndicator color={THEME.accent} />
            ) : error ? (
              <Text status="danger" category="p2" style={{ textAlign: 'center', fontWeight: '600' }}>{error}</Text>
            ) : (
              <Text category="p1" style={{ color: THEME.text, fontSize: 18 }}>Ingresa el PIN de acceso</Text>
            )}
          </View>
          
          <Flex vertical={false} gap={24}>
            {[0, 1, 2, 3, 4, 5].map(renderDot)}
          </Flex>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => dispatch({ type: 'SESSION_EXPIRED', reason: 'forgot_pin' })}
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
              style={styles.key}
              onPress={handleDelete}
              disabled={isKeypadDisabled}
            >
              <Text style={[styles.keyText, { fontSize: 16, color: THEME.textSecondary }]}>DEL</Text>
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
    alignSelf: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  forgotPin: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  keypadContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: THEME.keypadText,
    fontSize: 28,
    fontWeight: '400',
  },
});
