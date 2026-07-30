/**
 * Pure status transitions for portal-fetch jobs.
 * Secrets are never part of this machine — only status strings.
 */

import {
  type PortalFetchStatus,
  isTerminalStatus,
} from '@/lib/portal-fetch/types';

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
  if (isTerminalStatus(status)) return null;
  if (!ALLOWED[status].has(event.type)) return null;
  return NEXT[event.type];
}

/** Whether the user may submit an OTP for this status. */
export function canAcceptOtp(status: PortalFetchStatus): boolean {
  return status === 'awaiting_otp';
}

/** Whether live-assist escalation / resume is valid. */
export function canLiveAssist(status: PortalFetchStatus): boolean {
  return (
    status === 'needs_live_assist' ||
    status === 'logging_in' ||
    status === 'awaiting_otp' ||
    status === 'downloading'
  );
}
