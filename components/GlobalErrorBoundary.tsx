import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as ExpoRouter from 'expo-router';
import { logger } from '../shared/utils/logger';

const ExpoErrorBoundary = (ExpoRouter as any).ErrorBoundary;

interface Props {
  children?: ReactNode;
  error?: any;
  retry?: () => void;
}

interface State {
  hasError: boolean;
  error: any;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: props.error || null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('GlobalErrorBoundary caught a rendering error', 'ROUTER', { error, errorInfo });
  }

  componentDidUpdate(prevProps: Props) {
    // Si expo-router nos pasa un nuevo error, lo sincronizamos
    if (this.props.error && this.props.error !== prevProps.error) {
      this.setState({ hasError: true, error: this.props.error });
      logger.error('Expo Router passed an error to GlobalErrorBoundary', 'ROUTER', this.props.error);
    }
    
    // Si expo-router limpia el error (por ejemplo, tras un reintento o navegación), nosotros también
    if (prevProps.error && !this.props.error && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    const error = this.state.error || this.props.error;

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Crítico de Aplicación</Text>
          <Text style={styles.errorMessage}>{String(error)}</Text>
          <ExpoErrorBoundary 
            error={error} 
            retry={() => {
              this.setState({ hasError: false, error: null });
              this.props.retry?.();
            }} 
          />
        </View>
      );
    }

    return this.props.children || <ExpoErrorBoundary {...this.props} />;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  errorMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
});
