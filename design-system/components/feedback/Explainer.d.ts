import React from 'react';

export interface ExplainerProps {
  /** The term as the user sees it: "Chapter VI-A", "26AS", "presumptive", "belated". */
  term?: React.ReactNode;
  /** Two sentences of plain language. No statute quoting, no nesting more jargon. */
  definition: React.ReactNode;
  children?: React.ReactNode;
}

/** Dotted-underline term that opens a plain-language definition. Replaces the tooltip pattern entirely. */
export declare function Explainer(props: ExplainerProps): JSX.Element;
