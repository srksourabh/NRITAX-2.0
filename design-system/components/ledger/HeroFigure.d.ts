export interface HeroFigureProps {
  /** "Refund due" or "Tax payable" — the label carries the sign, never a minus in the figure. */
  label: string;
  amount: number;
  /** `credit` only for a confirmed refund. A payable figure is `ink`, never notice red. */
  tone?: 'ink' | 'credit';
  note?: string;
  size?: 'xl' | 'lg';
  /** Applies the stamp motion. Once per return, on real completion only. */
  stamp?: boolean;
}

/** The single large figure at the head of a review, summary card or acknowledgement. */
export declare function HeroFigure(props: HeroFigureProps): JSX.Element;
