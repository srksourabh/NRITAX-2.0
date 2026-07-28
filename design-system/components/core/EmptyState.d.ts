import React from 'react';

export interface EmptyStateProps {
  /** One line of direction. "No documents yet. Upload Form 16 to start." */
  line: React.ReactNode;
  /** Exactly one action. */
  action?: React.ReactNode;
}

/** One line of direction plus one action. No illustrations, no mascots — the blank ledger is the illustration. */
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
