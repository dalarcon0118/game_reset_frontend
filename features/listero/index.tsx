// Main feature exports for the Listero module
// This module handles betting operations for the listero role

// Export main screens/views
export { BetsListScreen } from './bets/screens/BetsListScreen';
export { EditListScreen } from './bets/screens/EditListScreen';
//export { CreateBetScreen } from './bets/screens/CreateBetScreen';

// Export dashboard components
export { default as DashboardScreen } from './dashboard/views';

// Export bet rules and rewards screens
export { RulesScreen } from './bets/screens/RulesScreen';
export { RewardsScreen } from './bets/screens/RewardsScreen';

// Export stores for advanced usage (if needed)
export { useBetsStore, selectBetsModel, selectDispatch } from './bets/store';
export { useDashboardStore } from './dashboard/store';

// Export types for TypeScript support
export type {
  // Core model types
  Model as BetsModel,
} from './bets/core/core.types';

// Re-export bet types from shared types
export type {
  FijosCorridosBet,
  ParletBet,
  CentenaBet,
} from '@/types';

// Re-export commonly used types from shared
export type { GameType, WinningRecord } from '../../types';

// Export constants
export { GameTypes, GameTypeLabels, AnnotationTypes } from '../../constants/Bet';
