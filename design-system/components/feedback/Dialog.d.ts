import React from 'react';

export interface DialogProps {
  open?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  /** `sheet` is the mobile bottom-sheet treatment; `modal` is centred. */
  variant?: 'modal' | 'sheet';
}

/** Modal and mobile bottom sheet. Focus trapped, Escape closes, focus restored on close. */
export declare function Dialog(props: DialogProps): JSX.Element;
