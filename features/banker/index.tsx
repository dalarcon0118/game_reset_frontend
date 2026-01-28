// Main feature exports for the Banker module
// This module handles banker operations

// Export main screens/views
export { default as DashboardScreen } from './dashboard';
export { default as DrawerScreen } from './drawers/list';

// Export stores for advanced usage (if needed)
export { useDashboardStore, selectDashboardModel, selectDashboardDispatch } from './dashboard/core';
export { useDrawersStore, selectDrawersModel, selectDrawersDispatch } from './drawers/core';

// Export types for TypeScript support
export type {
  Model as DashboardModel,
  Msg as DashboardMsg,
} from './dashboard/core';

export type {
  Model as DrawersModel,
  Msg as DrawersMsg,
} from './drawers/core';