import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { pluginManager } from './plugin.registry';
import { pluginEventBus } from './plugin.event_bus';
import { ErrorBoundary } from '../../components/error_boundary';
import { Flex } from '../../components/flex';
import { SlotProps } from './plugin.types';
import { SlotSkeleton } from '../../components/moti_skeleton';

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
  /** Si debe mostrar skeleton mientras no hay extensiones */
  useSkeleton?: boolean;
  /** Altura por defecto del skeleton si el plugin no la define */
  defaultSkeletonHeight?: number;
  /** Si el skeleton debe tener márgenes */
  skeletonNoMargin?: boolean;
}

interface SlotItemProps {
  id: string;
  component: React.ComponentType<any>;
  layout?: any;
  context: any;
  hostStore: any;
  contextData: any;
  pluginProps: any;
}

const SlotItem: React.FC<SlotItemProps> = ({ 
  id, 
  component: PluginComponent, 
  layout, 
  context, 
  hostStore, 
  contextData, 
  pluginProps 
}) => {
  const containerStyle: ViewStyle = {
    flex: layout?.flex ?? (layout?.fullWidth ? 1 : undefined),
    width: layout?.fullWidth ? '100%' : undefined,
    minHeight: layout?.minHeight,
    ...(layout?.containerStyle || {})
  };

  const pluginContext = React.useMemo(() => ({
    ...context,
    hostStore,
    state: {
      ...context.state,
      ...contextData
    }
  }), [context, hostStore, contextData]);

  return (
    <View style={containerStyle}>
      <ErrorBoundary 
        name={`Plugin:${id}`}
        fallback={<View style={styles.errorFallback} />}
      >
        <PluginComponent 
          {...pluginProps}
          context={pluginContext}
        />
      </ErrorBoundary>
    </View>
  );
};

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
  pluginProps = {},
  useSkeleton = false,
  defaultSkeletonHeight = 120,
  skeletonNoMargin = false
}) => {
  // Estado local para almacenar las extensiones
  const [extensions, setExtensions] = useState(() => pluginManager.getExtensionsForSlot(name));
  // Estado para trackear si el slot ha mostrado contenido alguna vez
  const [hasEverLoaded, setHasEverLoaded] = useState(false);

  // Efecto para suscribirse a cambios en el registro de plugins
  useEffect(() => {
    // Función para actualizar extensiones
    const updateExtensions = () => {
      const newExtensions = pluginManager.getExtensionsForSlot(name);
      if (newExtensions.length > 0) {
        setHasEverLoaded(true);
      }
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

  // Mostrar skeleton SOLO si se pide explícitamente y no hay extensiones cargadas
  if (extensions.length === 0) {
    if (useSkeleton) {
      return (
        <View style={[styles.container, style]}>
          <SlotSkeleton 
            height={defaultSkeletonHeight} 
            noMargin={skeletonNoMargin} 
          />
        </View>
      );
    }
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Flex vertical={direction === 'vertical'} wrap="wrap">
        {extensions.map(({ id, component, layout, context }) => (
          <SlotItem
            key={id}
            id={id}
            component={component}
            layout={layout}
            context={context}
            hostStore={hostStore}
            contextData={contextData}
            pluginProps={pluginProps}
          />
        ))}
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
