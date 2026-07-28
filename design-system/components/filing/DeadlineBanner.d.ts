import React from 'react';

export interface DeadlineBannerProps {
  /** Days remaining. Negative means the due date has passed and the banner changes meaning, not just colour. */
  days: number;
  /** Formatted date, e.g. "31 July 2026". */
  dueDate: string;
  /** Shown only on the final day. Never a ticking seconds display. */
  hoursLeft?: number;
  /** Belated tier: s.234F fee, already formatted. */
  lateFee?: string;
  /** Belated tier: the date belated filing closes. */
  revisedDeadline?: string;
  action?: React.ReactNode;
}

/** The due-date signal, tiered so it does not become permanent noise. Updates on page load only. */
export declare function DeadlineBanner(props: DeadlineBannerProps): JSX.Element;
/** The tier for a given days-remaining value. */
export declare function deadlineTier(days: number): 'quiet' | 'inline' | 'due' | 'notice' | 'belated';
