import React from 'react';

export interface StatuteChipProps {
  /** The reference verbatim: "u/s 80C", "s.288A", "Form 16 Part B", "26AS", "AIS". */
  children?: React.ReactNode;
  /** True when the chip names a source document rather than a section — renders on the info tint. */
  source?: boolean;
  /** Supply to open the extraction or the explainer for this reference. */
  onClick?: () => void;
  title?: string;
}

/** The margin reference that turns a number into a claim the user can verify. Plex Mono, 11px. */
export declare function StatuteChip(props: StatuteChipProps): JSX.Element;
