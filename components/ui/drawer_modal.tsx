import React from 'react';
import BottomDrawer from './bottom_drawer';

interface DrawerModalProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function DrawerModal({ visible, onClose, title, children }: DrawerModalProps) {
  return (
    <BottomDrawer
      isVisible={visible}
      onClose={onClose}
      title={title}
    >
      {children}
    </BottomDrawer>
  );
}
