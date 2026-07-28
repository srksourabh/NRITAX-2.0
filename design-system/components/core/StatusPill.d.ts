export type FilingStatus =
  | 'draft' | 'docs_pending' | 'parsing' | 'review_user' | 'review_expert'
  | 'ready_to_file' | 'payment_due' | 'filed_unverified' | 'everified'
  | 'processed' | 'refund_issued' | 'defective' | 'notice_received' | 'demand_raised';

export interface StatusPillProps {
  /** A key from the filing lifecycle taxonomy — supplies both the label and the colour. */
  status?: FilingStatus;
  /** Override only for states outside the filing lifecycle (e.g. document parse states). */
  tone?: 'credit' | 'due' | 'notice' | 'info' | 'primary' | 'draft';
  label?: string;
  dot?: boolean;
  /** Required on the ink shell header: the semantic tints are only tested against surface and paper.
   *  Renders surface text on a 10% white fill (17.15:1) with the semantic hue carried by the dot. */
  onInk?: boolean;
}

/** Pill that states a filing state. Never a brand adjective, never colour without a text label. */
export declare function StatusPill(props: StatusPillProps): JSX.Element;
export declare const FILING_STATUSES: Record<FilingStatus, { label: string; tone: string }>;
