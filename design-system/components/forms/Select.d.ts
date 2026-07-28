export interface SelectOption { value: string; label: string }

export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options?: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

/** Native select re-skinned to the system: 44px, 6px radius, neutral-300 border, chevron in neutral-400. */
export declare function Select(props: SelectProps): JSX.Element;
