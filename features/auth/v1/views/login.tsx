import React from 'react';
import { SafeAreaView, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Flex } from '@/shared/components';
import { useAuthV1 } from '../hooks/use_auth';
import { useLoginUI } from '../hooks/use_login_ui';
import { AuthStatus } from '@/shared/auth/v1/model';
import { SESSION_EXPIRED as SESSION_EXPIRED_MSG } from '@/shared/auth/v1/msg';
import { logger } from '@/shared/utils/logger';
import { LoginModule } from '../store';
import { styles } from './login.styles';

// Componentes modulares
import { LoginHeader } from './components/LoginHeader';
import { PinStatusDisplay } from './components/PinStatusDisplay';
import { NumericKeypad } from './components/NumericKeypad';
import { DeviceLockedView } from './components/DeviceLockedView';
import { ConnectionErrorView } from './components/ConnectionErrorView';

const log = logger.withTag('LOGIN_VIEW');

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

  React.useEffect(() => {
    log.debug('LoginContent username', username || "Invitado");
  }, [username]);

  if (status === AuthStatus.DEVICE_LOCKED) {
    return <DeviceLockedView error={error} />;
  }

  if (status === AuthStatus.CONNECTION_ERROR) {
    return <ConnectionErrorView error={error} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
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

export default function LoginScreen() {
  return (
    <LoginModule.Provider>
      <LoginContent />
    </LoginModule.Provider>
  );
}
