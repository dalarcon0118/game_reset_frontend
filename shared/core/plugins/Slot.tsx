import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { pluginManager } from './plugin.registry';
import { pluginEventBus } from './plugin.event_bus';
import { ErrorBoundary } from '../../components/error_boundary';
import { Flex } from '../../components/flex';
import { SlotProps } from './plugin.types';

interface Props {
  /** Nombre único del punto de inyección */
  name: string;
  /** Datos opcionales que el Host quiere pasar a los plugins */
  contextData?: any;
  /** Store del Host para que los plugins puedan suscribirse */
  hostStore?: any;
  /** Estilo para el contenedor del Slot */
  style?: StyleProp<ViewStyle>;
  /** Dirección del layout */
  direction?: 'vertical' | 'horizontal';
  /** Props adicionales para los componentes de plugin */
  pluginProps?: Record<string, any>;
}

/**
 * Componente Slot: El punto de inyección de UI para plugins.
 * Implementa resiliencia mediante ErrorBoundaries individuales.
 * Ahora es REACTIVO a la carga dinámica de plugins.
 */
export const Slot: React.FC<Props> = ({ 
  name, 
  contextData, 
  hostStore,
  style, 
  direction = 'vertical',
  pluginProps = {}
}) => {
  // Estado local para almacenar las extensiones
  const [extensions, setExtensions] = useState(() => pluginManager.getExtensionsForSlot(name));

  // Efecto para suscribirse a cambios en el registro de plugins
  useEffect(() => {
    // Función para actualizar extensiones
    const updateExtensions = () => {
      const newExtensions = pluginManager.getExtensionsForSlot(name);
      setExtensions(newExtensions);
    };

    // Suscribirse al evento de registro
    const unsubscribe = pluginEventBus.subscribe('sys:plugin_registered', (data) => {
        console.log(`[Slot:${name}] Plugin registered event received`, data);
        updateExtensions();
    });

    // Actualizar inmediatamente por si hubo cambios durante el montaje
    updateExtensions();

    return () => {
      unsubscribe();
    };
  }, [name]);

  if (extensions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Flex vertical={direction === 'vertical'} wrap="wrap">
        {extensions.map(({ id, component: PluginComponent, layout, context }) => {
          const containerStyle: ViewStyle = {
            flex: layout?.flex ?? (layout?.fullWidth ? 1 : undefined),
            width: layout?.fullWidth ? '100%' : undefined,
            ...(layout?.containerStyle || {})
          };

          return (
            <View key={id} style={containerStyle}>
              <ErrorBoundary 
                name={`Plugin:${id}`}
                fallback={<View style={styles.errorFallback} />}
              >
                <PluginComponent 
                  {...pluginProps}
                  context={{
                    ...context,
                    hostStore,
                    state: {
                      ...context.state,
                      ...contextData
                    }
                  }}
                />
              </ErrorBoundary>
            </View>
          );
        })}
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorFallback: {
    padding: 10,
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcccc',
    borderRadius: 4,
    margin: 4,
  }
});
