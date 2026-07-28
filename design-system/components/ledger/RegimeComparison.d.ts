import { LedgerRowSpec } from './LedgerBlock';

export interface RegimeColumn {
  /** Rows for this column's ledger — no `final` row; the total sits in the column footer. */
  rows: LedgerRowSpec[];
  /** Tax including cess, used for the delta. */
  tax: number;
}

export interface RegimeComparisonProps {
  oldRegime: RegimeColumn;
  newRegime: RegimeColumn;
  /** Which regime the return is currently filed under. */
  selected?: 'old' | 'new';
  onSelect?: (regime: 'old' | 'new') => void;
  /** States what switching drops: "Switching to the new regime removes 4 deductions worth ₹1,62,000." */
  switchNote?: string;
}

/** Side-by-side regimes, stacked on mobile with the recommended one first. Never colours the loser. */
export declare function RegimeComparison(props: RegimeComparisonProps): JSX.Element;
