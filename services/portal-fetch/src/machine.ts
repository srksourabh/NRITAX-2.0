/** Job status transitions (mirrors web/src/lib/portal-fetch/job-machine.ts). */

export type PortalFetchStatus =
  | 'queued'
  | 'logging_in'
  | 'awaiting_otp'
  | 'needs_live_assist'
  | 'downloading'
  | 'succeeded'
  | 'failed'
  | 'timed_out';

export type PortalFetchEvent =
  | { type: 'START_LOGIN' }
  | { type: 'NEED_OTP' }
  | { type: 'OTP_SUBMITTED' }
  | { type: 'NEED_LIVE_ASSIST' }
  | { type: 'LIVE_ASSIST_DONE' }
  | { type: 'START_DOWNLOAD' }
  | { type: 'SUCCESS' }
  | { type: 'FAIL' }
  | { type: 'TIMEOUT' };

const TERMINAL = new Set<PortalFetchStatus>(['succeeded', 'failed', 'timed_out']);

const ALLOWED: Record<PortalFetchStatus, ReadonlySet<PortalFetchEvent['type']>> = {
  queued: new Set(['START_LOGIN', 'FAIL', 'TIMEOUT']),
  logging_in: new Set([
    'NEED_OTP',
    'NEED_LIVE_ASSIST',
    'START_DOWNLOAD',
    'FAIL',
    'TIMEOUT',
  ]),
  awaiting_otp: new Set(['OTP_SUBMITTED', 'NEED_LIVE_ASSIST', 'FAIL', 'TIMEOUT']),
  needs_live_assist: new Set(['LIVE_ASSIST_DONE', 'FAIL', 'TIMEOUT']),
  downloading: new Set(['SUCCESS', 'FAIL', 'TIMEOUT', 'NEED_LIVE_ASSIST']),
  succeeded: new Set(),
  failed: new Set(),
  timed_out: new Set(),
};

const NEXT: Record<PortalFetchEvent['type'], PortalFetchStatus> = {
  START_LOGIN: 'logging_in',
  NEED_OTP: 'awaiting_otp',
  OTP_SUBMITTED: 'logging_in',
  NEED_LIVE_ASSIST: 'needs_live_assist',
  LIVE_ASSIST_DONE: 'downloading',
  START_DOWNLOAD: 'downloading',
  SUCCESS: 'succeeded',
  FAIL: 'failed',
  TIMEOUT: 'timed_out',
};

export function transition(
  status: PortalFetchStatus,
  event: PortalFetchEvent,
): PortalFetchStatus | null {
  if (TERMINAL.has(status)) return null;
  if (!ALLOWED[status].has(event.type)) return null;
  return NEXT[event.type];
}

export function isTerminal(status: PortalFetchStatus): boolean {
  return TERMINAL.has(status);
}
