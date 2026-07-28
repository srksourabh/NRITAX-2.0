export interface CheckboxProps {
  label?: string;
  hint?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

/** Independent yes/no choices. 20px box, 6px radius, inside a 44px hit row. */
export declare function Checkbox(props: CheckboxProps): JSX.Element;
