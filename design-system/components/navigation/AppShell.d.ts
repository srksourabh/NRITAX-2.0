import React from 'react';

export interface NavItem { label: string; active?: boolean; onClick?: () => void }

export interface AppShellProps {
  nav?: NavItem[];
  /** Account menu, expert button, status pill. */
  right?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface WordmarkProps {
  color?: string;
  size?: number;
}

export interface StickyActionBarProps {
  children?: React.ReactNode;
  /** Left-side context, e.g. "Saved 2 minutes ago". */
  note?: React.ReactNode;
}

/**
 * The app frame. The ink header is the only dark region in the product: 56px mobile, 60px desktop.
 * @startingPoint section="App" subtitle="Shell header, nav and sticky action bar" viewport="1120x220"
 */
export declare function AppShell(props: AppShellProps): JSX.Element;
/** The brand name in Archivo Expanded 600. No logo artwork exists in this system yet. */
export declare function Wordmark(props: WordmarkProps): JSX.Element;
/** Bottom bar holding the primary action in the thumb zone. Top hairline, no blur, no shadow. */
export declare function StickyActionBar(props: StickyActionBarProps): JSX.Element;
