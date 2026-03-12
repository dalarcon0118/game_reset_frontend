import { UserRole } from '../data/mock_data';
import { loginRoutes } from './routes/login';
import { adminRoutes, ADMIN_ROOT } from './routes/admin';
import { listerRoutes, LISTER_ROOT } from './routes/lister';
import { colectorRoutes, COLECTOR_ROOT } from './routes/colector';
import { bankerRoutes, BANKER_ROOT } from './routes/banker';

export default {
  ...loginRoutes,
  ...adminRoutes,
  ...listerRoutes,
  ...colectorRoutes,
  ...bankerRoutes
};

export const routes = {
  ...loginRoutes,
  ...adminRoutes,
  ...listerRoutes,
  ...colectorRoutes,
  ...bankerRoutes,
}

/**
 * Centralized Application Roots
 * Used by the Navigation Strategy to determine home routes
 */
export const AppRoots: Record<UserRole | string, string> = {
  admin: ADMIN_ROOT,
  listero: LISTER_ROOT,
  colector: COLECTOR_ROOT,
  banker: BANKER_ROOT,
};

export const roleToScreenMap = AppRoots;
