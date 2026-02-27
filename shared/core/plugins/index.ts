import { PluginManager } from './plugin.registry';

/**
 * Módulo de Sistema de Plugins
 * 
 * Este módulo provee la infraestructura base para el sistema de plugins.
 * La REGISTRACIÓN de plugins específicos debe ocurrir en los módulos correspondientes
 * (ej. features/listero/listero.plugins.ts), NO AQUÍ.
 * 
 * Mantener este archivo limpio de dependencias de features asegura que el Core
 * sea reutilizable y no tenga dependencias circulares.
 */

// Re-exportar elementos clave para facilitar el uso
export { PluginManager } from './plugin.registry';
export type { PluginContext, Plugin } from './plugin.types';
export * from './plugin.event_bus';
export * from './Slot';
export * from './debug_plugin';
