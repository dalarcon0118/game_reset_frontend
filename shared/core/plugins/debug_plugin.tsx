import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from '@ui-kitten/components';
import { Bug } from 'lucide-react-native';
import { Plugin, SlotProps } from './plugin.types';

/**
 * DebugPlugin: Un plugin de ejemplo para validar la arquitectura.
 * Muestra información del contexto y prueba el EventBus.
 */
const DebugInfoComponent: React.FC<SlotProps> = ({ context }) => {
  const [lastEvent, setLastEvent] = useState<string>('Ninguno');

  useEffect(() => {
    // Probar suscripción al EventBus
    const unsubscribe = context.events.subscribe('debug:ping', (data) => {
      setLastEvent(JSON.stringify(data));
      console.log('[DebugPlugin] Ping recibido!', data);
    });

    return () => unsubscribe();
  }, [context.events]);

  return (
    <Card style={styles.card} status="info">
      <View style={styles.header}>
        <Bug size={24} color="#3366FF" style={styles.icon} />
        <Text category="h6">Debug Plugin Active</Text>
      </View>
      
      <View style={styles.content}>
        <Text category="label">Estado del Host:</Text>
        <Text appearance="hint">
          Online: {context.state.isOnline ? '✅' : '❌'} | 
          User: {context.state.user?.username || 'Invitado'}
        </Text>
        
        <Text category="label" style={styles.spacing}>Último Evento:</Text>
        <Text appearance="hint" numberOfLines={1}>{lastEvent}</Text>
      </View>
    </Card>
  );
};

export const DebugPlugin: Plugin = {
  id: 'com.game-reset.debug',
  name: 'Debug Tool',
  init: (context) => {
    console.log('[DebugPlugin] Inicializado con contexto:', context);
    
    // Probar persistencia
    context.storage.setItem('last_init', new Date().toISOString());
    
    // Publicar un evento después de 5 segundos
    setTimeout(() => {
      context.events.publish('debug:ping', { message: 'Hola desde el pasado!', timestamp: Date.now() });
    }, 5000);
  },
  slots: {
    'dashboard.top': {
      component: DebugInfoComponent,
      layout: {
        order: 1,
        fullWidth: true
      }
    }
  },
  exports: {
    events: ['debug:ping']
  }
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  content: {
    gap: 4,
  },
  spacing: {
    marginTop: 8,
  }
});
