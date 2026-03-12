/**
 * Auth Feature Module (v1)
 * 
 * Este módulo orquesta la funcionalidad de autenticación en la capa de feature.
 * Implementa un patrón de fachada para ocultar la complejidad interna.
 */

export { AuthProviderV1, AuthModuleV1 } from './adapters/auth_provider';
export { useAuthV1 } from './hooks/use_auth';
export { default as LoginScreen } from './views/login';
export { default as WithRole } from './views/with_role';

// Re-exportar tipos esenciales para los consumidores
export { AuthStatus } from '@/shared/auth/v1/model';
export type { User } from '@/shared/repositories/auth/types/types';
