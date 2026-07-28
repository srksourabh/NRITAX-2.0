import React from 'react';

export interface CardProps {
  /** Defaults to 24px (use 20px on mobile). */
  padding?: string;
  /** Adds the hover treatment: neutral-50 fill and a primary-200 border. Never a shadow lift. */
  interactive?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export interface CardHeaderProps {
  title: React.ReactNode;
  /** Timestamp or source note, rendered in caption / neutral-500. */
  meta?: React.ReactNode;
  action?: React.ReactNode;
}

/** The flat document panel: surface fill, 1px neutral-200 border, 12px radius, no resting shadow. */
export declare function Card(props: CardProps): JSX.Element;
export declare function CardHeader(props: CardHeaderProps): JSX.Element;
