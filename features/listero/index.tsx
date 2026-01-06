// Main feature exports for the Listero module
// This module handles betting operations for the listero role

// Export main screens/views
export { default as BetsListScreen } from './bets/views/list';
export { default as BetsEditListScreen } from './bets/views/edit_list';
export { default as BetCreateScreen } from './bets/views/create_bet';
export { default as BetEditScreen } from './bet_edit';

// Export dashboard components
export { default as DashboardScreen } from './dashboard/views';

// Export bet rules and rewards screens
export { default as BetRulesScreen } from './bets/views/rules';
export { default as BetRewardsScreen } from './bets/views/rewards';

// Export hooks for external use
export { useBets } from './bets/hooks/useBets';
export { useDashboard } from './dashboard/hooks/useDashboard';

// Export stores for advanced usage (if needed)
export { useBetsStore, selectBetsModel, selectDispatch } from './bets/store';

// Export types for TypeScript support
export type {
  // Core model types
  Model as BetsModel,

  // Bet types
  FijosCorridosBet,
  ParletBet,
  CentenaBet,
} from './bets/store/types';

// Re-export commonly used types from shared
export type { GameType, WinningRecord } from '../../types';

// Export constants
export { GameTypes, GameTypeLabels, AnnotationTypes } from '../../constants/Bet';
