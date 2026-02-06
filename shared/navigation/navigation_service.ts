import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Singleton service to manage global navigation reference.
 * This allows TEA subscriptions and effect handlers to access the current navigation state
 * without being tightly coupled to React components or the model.
 */
export const navigationRef = createNavigationContainerRef();

export const NavigationService = {
  /**
   * Returns the name of the currently active route.
   */
  getCurrentRouteName(): string | undefined {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute()?.name;
    }
    return undefined;
  },

  /**
   * Check if the current route is an entry/editing screen.
   */
  isEditingScreen(): boolean {
    const routeName = this.getCurrentRouteName() || '';
    return routeName.includes('entry') || routeName.includes('anotacion');
  }
};
