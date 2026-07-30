/**
 * Shared portal-fetch job types (web + worker).
 * Credentials never appear on public status payloads.
 */

export const PORTAL_FETCH_STATUSES = [
  'queued',
  'logging_in',
  'awaiting_otp',
  'needs_live_assist',
  'downloading',
  'succeeded',
  'failed',
  'timed_out',
] as const;

export type PortalFetchStatus = (typeof PORTAL_FETCH_STATUSES)[number];

export const TERMINAL_STATUSES: ReadonlySet<PortalFetchStatus> = new Set([
  'succeeded',
  'failed',
  'timed_out',
]);

export interface PortalFetchPublicJob {
  id: string;
  status: PortalFetchStatus;
  assessmentYear: string;
  panMasked: string;
  message?: string;
  liveViewUrl?: string;
  /** Present only when status is succeeded. */
  artifactJson?: string;
}

export interface PortalFetchStartInput {
  pan: string;
  name: string;
  dob: string;
  password: string;
  mobile: string;
  assessmentYear: string;
  /** Both must be true; enforced by API and UI. */
  consentFetch: boolean;
  consentLiability: boolean;
}

export function maskPan(pan: string): string {
  const p = pan.trim().toUpperCase();
  if (p.length < 4) return '****';
  return `${p.slice(0, 2)}******${p.slice(-2)}`;
}

export function isTerminalStatus(status: PortalFetchStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
