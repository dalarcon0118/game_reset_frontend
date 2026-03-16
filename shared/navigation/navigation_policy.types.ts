import { UserRole } from '../../data/mock_data';

export interface NavigationPolicy {
  getHomeRoute(user: { role: UserRole | string } | null | undefined): string;
  canAccess(user: { role: UserRole | string } | null | undefined, pathname: string): boolean;
  getBackPath(user: { role: UserRole | string } | null | undefined, pathname: string): string | null;
}
