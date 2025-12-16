export interface ParletUIState {
  // UI State
  isParletDrawerVisible: boolean;
  isParletModalVisible: boolean;
  isAmmountDrawerVisible: boolean;
  parletAlertVisibleState: boolean;
  
  // UI Actions
  showParletDrawer: (visible: boolean) => void;
  showParletModal: (visible: boolean) => void;
  showAmmountDrawer: (visible: boolean) => void;
  showParletAlert: (visible: boolean) => void;
  
  // UI Helpers
  closeAllDrawers: () => void;
}