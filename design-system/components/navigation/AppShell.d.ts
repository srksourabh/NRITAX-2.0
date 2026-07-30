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

export interface SealMarkProps {
  size?: number;
  title?: string;
}

export interface BrandLockupProps {
  color?: string;
  sealSize?: number;
  wordSize?: number;
}

export interface StickyActionBarProps {
  children?: React.ReactNode;
  /** Left-side context, e.g. "Saved 2 minutes ago". */
  note?: React.ReactNode;
}

/**
 * The app frame. Ink header with 3px seal bottom border; circular SealMark + Wordmark.
 * @startingPoint section="App" subtitle="Shell header, nav and sticky action bar" viewport="1120x220"
 */
export declare function AppShell(props: AppShellProps): JSX.Element;
/** Circular seal (ink + seal ring, mono NT / 2.0). Artwork also at assets/logo/nritax-seal.svg. */
export declare function SealMark(props: SealMarkProps): JSX.Element;
/** Brand name NRITAX 2.0 in Archivo Expanded + Plex Mono. */
export declare function Wordmark(props: WordmarkProps): JSX.Element;
/** SealMark beside Wordmark — default chrome brand treatment. */
export declare function BrandLockup(props: BrandLockupProps): JSX.Element;
/** Bottom bar holding the primary action in the thumb zone. Top hairline, no blur, no shadow. */
export declare function StickyActionBar(props: StickyActionBarProps): JSX.Element;
