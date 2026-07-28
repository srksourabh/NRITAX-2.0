import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Always visible. Placeholder text is never the label. */
  label?: string;
  hint?: string;
  /** Names the cause and the fix: "PAN must be 10 characters. You entered 9." */
  error?: string;
  /** Marked in text, never by asterisk or colour alone. */
  required?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  align?: 'left' | 'right';
  /** Renders the value in Plex Mono with tabular figures. */
  mono?: boolean;
}

/**
 * The text field for every non-money, non-identifier value.
 * @startingPoint section="Forms" subtitle="Fields, money input, character boxes, choices" viewport="700x380"
 */
export declare function Input(props: InputProps): JSX.Element;
