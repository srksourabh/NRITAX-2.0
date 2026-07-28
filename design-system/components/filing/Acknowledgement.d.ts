export interface AcknowledgementProps {
  /** The 15-digit acknowledgement number from the department. */
  ackNumber: string;
  filedOn?: string;
  regime?: string;
  itrForm?: string;
  /** Already-formatted result line, e.g. "Refund due ₹8,557". */
  figure?: string;
  /** The stamp motion. Fires once per return, on real completion only. */
  animate?: boolean;
}

/** The filed receipt. The one place in the product that uses the stamp motion. */
export declare function Acknowledgement(props: AcknowledgementProps): JSX.Element;
