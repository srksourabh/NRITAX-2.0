export interface ParsedField {
  label: string;
  value: string;
  /** Fields the parser was unsure about get a "Check this" chip in `due` and are focused first on review. */
  uncertain?: boolean;
}

export interface DocumentUploadProps {
  /** `password` and `failed` are first-class states, not errors. */
  state?: 'idle' | 'parsing' | 'password' | 'failed' | 'parsed';
  accepts?: string;
  fileName?: string;
  fields?: ParsedField[];
  /** Names the cause and the fix. "This file has 0 pages we could read. It may be a scan…" */
  error?: string;
  onTakePhoto?: () => void;
  onChooseFile?: () => void;
  onPassword?: () => void;
  onEditField?: (field?: ParsedField) => void;
  progressLabel?: string;
}

/** Document intake for Form 16, 26AS, AIS and bank statements, with all five states. */
export declare function DocumentUpload(props: DocumentUploadProps): JSX.Element;
