export interface SwitchProps {
  label?: string;
  hint?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

/** A setting that takes effect immediately — never a form value that needs saving. */
export declare function Switch(props: SwitchProps): JSX.Element;
