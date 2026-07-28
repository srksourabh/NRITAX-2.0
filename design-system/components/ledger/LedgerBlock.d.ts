export type IncomeHead = 'salary' | 'house' | 'capgains' | 'business' | 'other' | 'foreign';

export interface LedgerRowSpec {
  label: string;
  /** Statute or source reference for the left margin column: "u/s 80C", "26AS", "Form 16 Part B". */
  statute?: string;
  amount: number | string;
  /** `subtotal` draws a hairline above the amount cell. `final` draws the double rule — once per sheet. */
  kind?: 'row' | 'subtotal' | 'final';
  /** Draws the 3px income-head stripe on the row's left edge. */
  head?: IncomeHead;
  /** Marks a row the user overrode manually; the chip reverts to the parsed value. */
  edited?: boolean;
  onEditRevert?: () => void;
}

export interface LedgerBlockProps {
  rows?: LedgerRowSpec[];
  caption?: string;
  /** The ₹ column header above the amount column. */
  currencyHeader?: boolean;
  style?: React.CSSProperties;
}

/**
 * The signature component. Every tax figure in the product lives inside one of these.
 * @startingPoint section="Ledger" subtitle="The computation sheet, regime comparison and schedule tables" viewport="700x420"
 */
export declare function LedgerBlock(props: LedgerBlockProps): JSX.Element;
export declare function LedgerRow(props: LedgerRowSpec): JSX.Element;
/** en-IN grouping for a ledger amount. */
export declare function formatFigure(v: number | string): string;
