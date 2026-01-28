import React from 'react';
import bottom_drawer from './bottom_drawer';

interface drawer_modalProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function drawer_modal({ visible, onClose, title, children }: drawer_modalProps) {
  return (
    <bottom_drawer
      isVisible={visible}
      onClose={onClose}
      title={title}
    >
      {children}
    </bottom_drawer>
  );
}
