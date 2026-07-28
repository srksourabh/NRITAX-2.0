export interface RadioOption { value: string; label: string; hint?: string }

export interface RadioGroupProps {
  label?: string;
  hint?: string;
  name?: string;
  options?: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
}

/** One choice from a short exclusive set, in a real fieldset with a legend. */
export declare function RadioGroup(props: RadioGroupProps): JSX.Element;
