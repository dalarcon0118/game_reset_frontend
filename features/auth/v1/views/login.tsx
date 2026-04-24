import React, { useMemo } from 'react';
import { TouchableOpacity, ScrollView, Keyboard, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Flex, ScreenContainer } from '@/shared/components';
import { useAuthV1 } from '../hooks/use_auth';
import { useLoginUI } from '../hooks/use_login_ui';
import { useResponsiveLogin, type LoginMetrics } from '../hooks/use_responsive_login';
import { LoginModule } from '../store';
import { AuthStatus } from '@/shared/auth/v1/model';
import { SESSION_EXPIRED as SESSION_EXPIRED_MSG } from '@/shared/auth/v1/msg';
import { createLoginStyles, THEME } from './login.styles';

import { LoginHeader } from './components/LoginHeader';
import { PinStatusDisplay } from './components/PinStatusDisplay';
import { NumericKeypad } from './components/NumericKeypad';
import { DeviceLockedView } from './components/DeviceLockedView';
import { ConnectionErrorView } from './components/ConnectionErrorView';

function LoginContent() {
  const {
    status,
    isAuthenticating,
    error,
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

  const metrics = useResponsiveLogin();
  const styles = useMemo(() => createLoginStyles(metrics), [metrics]);

  const isInputDisabled = isAuthenticating || isEditingUsername;

  const dismissKeyboard = () => {
    if (isEditingUsername) {
      Keyboard.dismiss();
      toggleEditUsername(false);
    }
  };

  if (status === AuthStatus.DEVICE_LOCKED) {
    return <DeviceLockedView error={error} />;
  }

  if (status === AuthStatus.CONNECTION_ERROR) {
    return <ConnectionErrorView error={error} />;
  }

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      backgroundColor={THEME.background}
      style={styles.container}
    >
      <View style={styles.headerSection}>
        <LoginHeader
          username={username}
          onUsernameUpdate={updateUsername}
          isEditing={isEditingUsername}
          setIsEditing={toggleEditUsername}
          metrics={metrics}
          styles={styles}
        />
      </View>

      <View style={styles.scrollSection}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Flex vertical align="center" gap={metrics.contentGap} style={styles.contentWrapper}>
            <PinStatusDisplay
              pinLength={pin.length}
              isAuthenticating={isAuthenticating}
              error={error}
              metrics={metrics}
              styles={styles}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => authDispatch(SESSION_EXPIRED_MSG({ reason: 'forgot_pin' }))}
            >
              <Text style={styles.forgotPin}>¿Olvidaste tu PIN?</Text>
            </TouchableOpacity>
          </Flex>
        </ScrollView>
      </View>

      <View style={styles.bottomSection}>
        <NumericKeypad
          onPress={appendPin}
          onDelete={removeLastPin}
          isDisabled={isInputDisabled}
          metrics={metrics}
          styles={styles}
        />
      </View>
    </ScreenContainer>
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
