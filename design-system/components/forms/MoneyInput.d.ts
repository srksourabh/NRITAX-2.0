export interface MoneyInputProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Digits only. Grouping is applied on blur, never on every keystroke. */
  value?: string | number;
  onChange?: (raw: string) => void;
  /** Source document chip on the right edge when the value came from a parse: "Form 16", "AIS". */
  source?: string;
  onSourceClick?: () => void;
  disabled?: boolean;
  id?: string;
}

/** Rupee field: fixed ₹ prefix, right-aligned Plex Mono, en-IN grouping, words echo at or above ₹1,00,000. */
export declare function MoneyInput(props: MoneyInputProps): JSX.Element;
/** Indian digit grouping through Intl.NumberFormat('en-IN'). Never hand-roll a regex. */
export declare function formatINR(n: number | string): string;
/** "Twelve lakh thirty-four thousand" — the extra-zero check under a money field. */
export declare function amountInWords(value: number | string): string;
