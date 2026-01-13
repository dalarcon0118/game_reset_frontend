import { UserRole } from '../data/mockData';
import { loginRoutes } from './routes/login';
import { adminRoutes } from './routes/admin';
import { listerRoutes } from './routes/lister';
import { colectorRoutes } from './routes/colector';
import { bankerRoutes } from './routes/banker';

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


export const roleToScreenMap: Record<UserRole | string, string> = {
  admin: '(admin)',
  listero: "lister",
  colector: 'colector/(tabs)',
  banker: 'banker',
};
