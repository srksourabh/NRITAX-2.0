import React from 'react';

export interface ButtonProps {
  /** Primary advances the filing — one per view section. Destructive is never a filled red button. */
  variant?: 'primary' | 'secondary' | 'quiet' | 'destructive' | 'link';
  /** 44px default, 52px for the mobile sticky primary, 36px compact for table/toolbar rows only. */
  size?: 'default' | 'mobilePrimary' | 'compact';
  /** Keeps the label and prefixes a 14px spinner so the button does not change width. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * The action control for both surfaces. Labels name the outcome ("File my return"), never "Submit".
 * @startingPoint section="Core" subtitle="Buttons, pills, statute chips and cards" viewport="700x260"
 */
export declare function Button(props: ButtonProps): JSX.Element;
