import React from 'react';

/**
 * Metadatos para el renderizado de componentes en Slots.
 */
export interface SlotComponentMetadata {
    /** Prioridad de renderizado (menor número = antes) */
    order?: number;
    /** Estilo flexbox para el contenedor */
    flex?: number;
    /** Si debe ocupar todo el ancho disponible */
    fullWidth?: boolean;
    /** Estilos adicionales para el contenedor */
    containerStyle?: any;
    /** Altura mínima a reservar mientras el plugin carga */
    minHeight?: number;
    /** Si debe usar skeleton animado mientras carga */
    useSkeleton?: boolean;
}

/**
 * Bus de eventos simplificado para plugins.
 */
export interface PluginEventBus {
    subscribe(event: string, handler: (data: any) => void): () => void;
    publish(event: string, data?: any): void;
}

/**
 * El contexto que el Host entrega a cada plugin durante su ciclo de vida.
 */
export interface PluginContext {
    /** Acceso controlado al backend */
    api: {
        get: <T>(endpoint: string) => Promise<T>;
        post: <T>(endpoint: string, body: any) => Promise<T>;
        /** Servicios especializados inyectados por el host */
        [key: string]: any;
    };
    /** Acceso a persistencia local */
    storage: {
        getItem: (key: string) => Promise<any>;
        setItem: (key: string, value: any) => Promise<void>;
    };
    /** Comunicación entre plugins */
    events: PluginEventBus;
    /** Acceso al store del Host para suscripciones (opcional) */
    hostStore?: any;
    /** Estado compartido del Host (solo lectura) */
    state: {
        user: any;
        isOnline: boolean;
        theme: any;
        [key: string]: any;
    };
}

/**
 * Representa un plugin agnóstico (Inspirado en Eclipse RCP).
 */
export interface Plugin<TProps = any> {
    id: string;
    name: string;
    /**
     * Ciclo de vida: Inicialización del plugin.
     * Aquí el plugin puede suscribirse a eventos o preparar datos.
     */
    init?: (context: PluginContext) => void;
    /**
     * Ciclo de vida: Limpieza del plugin al ser desregistrado.
     */
    cleanup?: (context: PluginContext) => void;
    /**
     * Ciclo de vida: Destrucción (legacy/alternativo).
     */
    destroy?: () => void;
    /**
     * Mapa de extensiones de UI por Slot.
     */
    slots: {
        [slotName: string]: {
            component: React.ComponentType<TProps>;
            layout?: SlotComponentMetadata;
        };
    };
    /** Versión del plugin */
    version?: string;
    /** Definición de eventos que este plugin emite (opcional) */
    exports?: {
        events?: string[];
    };
    metadata?: Record<string, any>;
}

/**
 * Props que el Slot inyecta en cada componente de plugin.
 */
export interface SlotProps {
    context: PluginContext;
    [key: string]: any;
}
