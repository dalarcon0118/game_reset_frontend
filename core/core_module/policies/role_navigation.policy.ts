import { AppRoots } from '../../../config/routes';
import { UserRole } from '../../../data/mock_data';

/**
 * RoleNavigationPolicy
 * 
 * Centraliza la lógica de navegación basada en roles que anteriormente residía en el AppKernel.
 * Define a qué ruta debe ir cada usuario y valida si tiene permiso para acceder a una ruta.
 */
export const RoleNavigationPolicy = {
  /**
   * Retorna la ruta inicial (Home) para un usuario basado en su rol.
   */
  getHomeRoute(user: { role: UserRole | string } | null | undefined): string {
    if (!user?.role) return '/login';

    const roleKey = user.role.toLowerCase();

    // Mapeo directo desde AppRoots definido en config/routes.ts
    const root = AppRoots[roleKey];

    if (root) return root;

    // Fallbacks basados en roles comunes si no están en AppRoots
    switch (roleKey) {
      case 'admin': return '/admin';
      case 'banker': return '/banker/(tabs)';
      case 'colector': return '/colector/(tabs)';
      case 'listero':
      case 'lister': return '/lister/(tabs)';
      default: return '/login';
    }
  },

  /**
   * Valida si un usuario tiene permiso para acceder a una ruta específica.
   */
  canAccess(user: { role: UserRole | string } | null | undefined, pathname: string): boolean {
    if (!user?.role) return false;

    const role = user.role.toLowerCase();
    const path = pathname.toLowerCase();

    // Rutas públicas permitidas para todos
    if (['/login', '/register', '/forgot-password'].some(p => path.includes(p))) {
      return true;
    }

    // Reglas básicas de acceso por prefijo de ruta
    if (path.startsWith('/admin') && role !== 'admin') return false;
    if (path.startsWith('/banker') && role !== 'banker') return false;
    if (path.startsWith('/colector') && role !== 'colector') return false;
    if (path.startsWith('/lister') && (role !== 'lister' && role !== 'listero')) return false;

    return true;
  },

  /**
   * Retorna la ruta de retorno lógica basada en el rol y la ruta actual.
   */
  getBackPath(user: { role: UserRole | string } | null | undefined, pathname: string): string | null {
    if (!user?.role) return null;

    // Aquí se podrían añadir reglas de "Back" personalizadas por rol
    // Por ahora retornamos null para usar el back estándar del router
    return null;
  }
};
