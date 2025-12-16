import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useColorScheme } from 'react-native';
import { Layout, Text, Input, Button, Card } from '@ui-kitten/components';
import LayoutConstants from '@/constants/Layout';
import { useLoginForm } from '../hooks/useLoginForm';
import { Controller } from 'react-hook-form';

export default function LoginScreen() {
  const { handleSubmit, errors, isSubmitting, control } = useLoginForm();

  return (
    
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Layout style={styles.inner} level='1'>
          <Layout style={styles.logoContainer} level='1'>
            <Text category='h1' style={styles.appTitle}>
              Game-reset
            </Text>
            <Text category='s1' appearance='hint' style={styles.appSubtitle}>
              Sistema de Gestión de Apuestas
            </Text>
          </Layout>

          <Card style={styles.loginCard}>
            <Text category='h5' style={styles.cardTitle}>
              Iniciar Sesión
            </Text>

            <Layout style={styles.inputContainer} level='1'>
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
            </Layout>

            <Layout style={styles.inputContainer} level='1'>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label='Contraseña'
                    placeholder='Ingrese su contraseña'
                    value={value}
                    onChangeText={onChange}
                    caption={errors.password?.message}
                    status={errors.password ? 'danger' : 'basic'}
                    secureTextEntry
                  />
                )}
              />
            </Layout>

            {errors.root && (
              <Text 
                category='c1' 
                status='danger'
                style={styles.errorText}
              >
                {errors.root.message}
              </Text>
            )}

            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.loginButton}
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </Card>
        </Layout>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: LayoutConstants.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: LayoutConstants.spacing.xl,
  },
  appTitle: {
    marginBottom: LayoutConstants.spacing.xs,
  },
  appSubtitle: {
    textAlign: 'center',
  },
  loginCard: {
    padding: LayoutConstants.spacing.lg,
  },
  cardTitle: {
    marginBottom: LayoutConstants.spacing.lg,
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
  }
});