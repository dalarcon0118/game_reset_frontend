import { create } from 'zustand';
import { ParletUIState } from './IParletUI.store';

export const useParletUIStore = create<ParletUIState>((set) => ({
  // UI State
  isParletDrawerVisible: false,
  isParletModalVisible: false,
  isAmmountDrawerVisible: false,
  parletAlertVisibleState: false,
  
  // UI Actions
  showParletDrawer: (visible: boolean) => {
    set({ isParletDrawerVisible: visible });
  },
  
  showParletModal: (visible: boolean) => {
    set({ isParletModalVisible: visible });
  },
  
  showAmmountDrawer: (visible: boolean) => {
    set({ isAmmountDrawerVisible: visible });
  },
  
  showParletAlert: (visible: boolean) => {
    set({ parletAlertVisibleState: visible });
  },
  
  // UI Helpers
  closeAllDrawers: () => {
    set({
      isParletDrawerVisible: false,
      isAmmountDrawerVisible: false,
    });
  },
}));