export interface Expert {
  name: string;
  initials: string;
  /** "CA · M. No. 2XXXXX" — the credential is why the panel exists. */
  credential: string;
  lastActive: string;
}

export interface ExpertMessage {
  from: 'you' | 'expert';
  text: string;
  at?: string;
}

export interface ExpertPanelProps {
  expert: Expert;
  messages?: ExpertMessage[];
  open?: boolean;
  /** 400px right drawer on desktop, bottom sheet on mobile. */
  variant?: 'drawer' | 'sheet';
  onClose?: () => void;
  onSend?: (text: string) => void;
}

/** The human takeover channel. The expert's name, credential and last-active state stay fixed at the top. */
export declare function ExpertPanel(props: ExpertPanelProps): JSX.Element;
