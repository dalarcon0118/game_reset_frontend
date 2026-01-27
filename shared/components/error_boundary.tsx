import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from '@ui-kitten/components';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      `ErrorBoundary [${this.props.name || 'Anonymous'}] caught an error`,
      'ERROR_BOUNDARY',
      { error, errorInfo }
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Icon
            name="alert-circle-outline"
            fill="#FF3D71"
            style={styles.icon}
          />
          <Text category="h5" style={styles.title}>
            Algo salió mal
          </Text>
          <Text appearance="hint" style={styles.message}>
            {this.state.error?.message || 'Se produjo un error inesperado al renderizar esta vista.'}
          </Text>
          <Button
            status="primary"
            onPress={this.handleReset}
            style={styles.button}
            accessoryLeft={(props) => <Icon {...props} name="refresh-outline" />}
          >
            Reintentar
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    minWidth: 150,
  },
});
