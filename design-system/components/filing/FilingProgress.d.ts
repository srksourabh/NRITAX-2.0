export interface FilingProgressProps {
  /** Defaults to FILING_STEPS. Step names come from the user's world, never internal ones. */
  steps?: string[];
  /** Zero-based index of the current step. */
  current?: number;
  /** Only completed steps are tappable. */
  onStep?: (index: number) => void;
  /** Mobile treatment: "Step 3 of 7" plus a progress track. */
  compact?: boolean;
}

/** The filing stepper. The current step name is also the page h1, so there is one title, not two. */
export declare function FilingProgress(props: FilingProgressProps): JSX.Element;
export declare const FILING_STEPS: string[];
