/**
 * Auth Feature Module (v1)
 * 
 * Este módulo orquesta la funcionalidad de autenticación en la capa de feature.
 * Implementa un patrón de fachada para ocultar la complejidad interna.
 */

// Exportar componentes y hooks base
import { AuthProviderV1, AuthModuleV1 } from './adapters/auth_provider';
import { useAuthV1 } from './hooks/use_auth';

export { AuthProviderV1, AuthModuleV1, useAuthV1 };
export { default as LoginScreen } from './views/login';
export { default as WithRole } from './views/with_role';

// Re-exportar tipos esenciales para los consumidores
export { AuthStatus } from '@/shared/auth/v1/model';
export type { User } from '@/shared/repositories/auth/types/types';

// Compatibilidad con código que busca AuthProvider o useAuth directamente (sin v1)
export { AuthProviderV1 as AuthProvider };
export { useAuthV1 as useAuth };
