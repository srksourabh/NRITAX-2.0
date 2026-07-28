export interface TrustMark {
  /** ISO 27001, SOC 2, e-Return Intermediary, AES-256. Only marks the company actually holds. */
  name: string;
  /** The registration or certificate number where one exists. */
  reference?: string;
}

export interface TrustBarProps {
  marks?: TrustMark[];
  align?: 'flex-start' | 'center' | 'space-between';
}

/** Static monochrome certification lockups. Marketing footer, first upload screen, payment screen — nowhere else. */
export declare function TrustBar(props: TrustBarProps): JSX.Element;
