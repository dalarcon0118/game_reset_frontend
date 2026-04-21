import React from 'react';
import { SafeAreaView, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Flex } from '@/shared/components';
import { useAuthV1 } from '../hooks/use_auth';
import { useLoginUI } from '../hooks/use_login_ui';
import { LoginModule } from '../store';
import { AuthStatus } from '@/shared/auth/v1/model';
import { SESSION_EXPIRED as SESSION_EXPIRED_MSG } from '@/shared/auth/v1/msg';
import { styles } from './login.styles';

import { LoginHeader } from './components/LoginHeader';
import { PinStatusDisplay } from './components/PinStatusDisplay';
import { NumericKeypad } from './components/NumericKeypad';
import { DeviceLockedView } from './components/DeviceLockedView';
import { ConnectionErrorView } from './components/ConnectionErrorView';

/**
 * LoginContent
 * Orquestador de la vista de Login. Conecta la lógica de negocio (Auth)
 * con la lógica de UI y los componentes visuales.
 */
function LoginContent() {
  const {
    status,
    isAuthenticating,
    error,
    login,
    dispatch: authDispatch
  } = useAuthV1();

  const {
    username,
    pin,
    isEditingUsername,
    updateUsername,
    appendPin,
    removeLastPin,
    toggleEditUsername,
  } = useLoginUI();

  const isInputDisabled = isAuthenticating || isEditingUsername;

  if (status === AuthStatus.DEVICE_LOCKED) {
    return <DeviceLockedView error={error} />;
  }

  if (status === AuthStatus.CONNECTION_ERROR) {
    return <ConnectionErrorView error={error} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 90}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Flex flex={1} vertical justify="center" gap={30} align="center" padding="xl">
            <LoginHeader
              username={username}
              onUsernameUpdate={updateUsername}
              isEditing={isEditingUsername}
              setIsEditing={toggleEditUsername}
            />

            <Flex vertical align="center" gap={20} style={{ width: '100%' }}>
              <PinStatusDisplay
                pinLength={pin.length}
                isAuthenticating={isAuthenticating}
                error={error}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => authDispatch(SESSION_EXPIRED_MSG({ reason: 'forgot_pin' }))}
              >
                <Text style={styles.forgotPin}>¿Olvidaste tu PIN?</Text>
              </TouchableOpacity>
            </Flex>
            <NumericKeypad
              onPress={appendPin}
              onDelete={removeLastPin}
              isDisabled={isInputDisabled}
            />
          </Flex>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * LoginProvider
 * Provider memoizado para evitar que el store se re-cree en cada render.
 *
 * ⚠️ IMPORTANTE: Este componente DEBE ser memoizado para evitar re-renders
 * innecesarios del Provider y sus hijos.
 */
const LoginProvider = React.memo<{ children: React.ReactNode }>(({ children }) => (
  <LoginModule.Provider>
    {children}
  </LoginModule.Provider>
));

LoginProvider.displayName = 'LoginProvider';

const StableLoginContent = React.memo(LoginContent);
StableLoginContent.displayName = 'StableLoginContent';

export default function LoginScreen() {
  return (
    <LoginProvider>
      <StableLoginContent />
    </LoginProvider>
  );
}
