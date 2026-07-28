export interface CharacterBoxInputProps {
  /** Grouping, length, keyboard and validation pattern all follow the identifier. */
  kind?: 'pan' | 'tan' | 'aadhaar' | 'ifsc';
  label?: string;
  hint?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  name?: string;
}

/** Per-character boxes mirroring the physical form. One real input underneath carries the value. */
export declare function CharacterBoxInput(props: CharacterBoxInputProps): JSX.Element;
/** "XXXX XXXX 1234" — apply the moment Aadhaar is entered and everywhere it is later displayed. */
export declare function maskAadhaar(value: string): string;
