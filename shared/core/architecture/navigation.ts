import { NavigationStrategy } from './interfaces';

/**
 * RoleBasedStrategy
 * 
 * Implements a navigation strategy based on user roles.
 * Maps roles to specific home routes and validates access.
 */
export class RoleBasedStrategy implements NavigationStrategy {
    constructor(private routes: Record<string, string>) { }

    /**
     * Determines the home route for a given user based on their role.
     * @param user The user object containing a role property
     * @returns The path string for the home route
     */
    getHomeRoute(user: any): string {
        if (!user || !user.role) {
            return '/login';
        }
        return this.routes[user.role] || '/login';
    }

    /**
     * Checks if a user has access to a specific path.
     * Simple implementation: checks if the path starts with the user's home route.
     * Can be extended for more complex ACLs.
     * 
     * @param user The user object
     * @param path The path to check access for
     */
    canAccess(user: any, path: string): boolean {
        if (!user) return false;
        
        const home = this.routes[user.role];
        if (!home) return false;

        // Extract base scope from home route
        // e.g., "/lister/(tabs)" -> "/lister"
        // e.g., "/(admin)" -> "/(admin)"
        // e.g., "/banker" -> "/banker"
        const baseScope = home.replace(/\/\(tabs\)$|\/index$/, '');
        
        // Also normalize the path being checked
        // e.g. "/lister/profile" -> "/lister/profile"
        // e.g. "/lister" -> "/lister"
        
        // Allow access if path starts with the base scope
        return path.startsWith(baseScope);
    }

    /**
     * Determines if a custom back navigation is required.
     * Returns the target path or null to use default behavior.
     */
    getBackPath(user: any, currentPath: string): string | null {
        if (!user || !user.role) return null;

        // Listero Logic: Escape from transactional flows to Dashboard
        if (user.role === 'listero') {
             if (currentPath.includes('/bets_create/') || currentPath.includes('/bets_list/')) {
                 return this.getHomeRoute(user);
             }
        }

        return null;
    }
}
