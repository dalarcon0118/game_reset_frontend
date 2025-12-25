import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import { Input, Button, Card, useTheme } from '@ui-kitten/components';
import LayoutConstants from '../../../constants/Layout';
import { useLoginForm } from '../hooks/useLoginForm';
import { Controller } from 'react-hook-form';
import { Flex, Label } from '../../../shared/components';
import { Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const { handleSubmit, errors, isSubmitting, control } = useLoginForm();
  const theme = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  return (

    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Flex flex={1} vertical justify="center" padding="l">
          <Flex vertical align="center" margin={[{ type: 'bottom', value: 'xl' }]}>
            <Label type="title" value="Game-reset" />
            <Label type="subtitle" style={styles.appSubtitle} value="Sistema de Gestión de Apuestas" />
          </Flex>

          <Card>
            <Label type="header" value={" Iniciar Sesión"} />
            <Flex flex={1} vertical margin={[{ type: 'bottom', value: 'xxl' }]}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label='Usuario'
                    placeholder='Ingrese su usuario'
                    value={value}
                    onChangeText={onChange}
                    caption={errors.username?.message}
                    status={errors.username ? 'danger' : 'basic'}
                    autoCapitalize="none"
                  />
                )}
              />
            </Flex>

            <Flex vertical margin={[{ type: 'top', value: 'l' }, { type: 'bottom', value: 'm' }]}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label='Contraseña:'
                    placeholder='Ingrese su contraseña'
                    value={value}
                    onChangeText={onChange}
                    caption={errors.password?.message}
                    status={errors.password ? 'danger' : 'basic'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!isPasswordVisible}
                    accessoryRight={() => (
                      <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                        {isPasswordVisible ? (
                          <EyeOff size={20} color={theme['color-basic-600']} />
                        ) : (
                          <Eye size={20} color={theme['color-basic-600']} />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                )}
              />
            </Flex>

            {errors.root && (
              <Label
                type="detail"
                status="danger"
                style={styles.errorText}
              >
                {errors.root.message}
              </Label>
            )}

            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.loginButton}
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </Card>
        </Flex>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appSubtitle: {
    textAlign: 'center',
  },

  inputContainer: {
    marginBottom: LayoutConstants.spacing.md,
  },
  loginButton: {
    marginTop: LayoutConstants.spacing.lg,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: LayoutConstants.spacing.md,
  },
});
