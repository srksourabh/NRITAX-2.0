/**
 * Local DigiLocker stand-in for casparser Pro when DIGILOCKER_MOCK=1.
 * Lets localhost exercise the auto-fill UI without HTTPS DigiLocker.
 */

import { digilockerMockEnabled, isHttpsRedirect } from '@/lib/sandbox/digilocker-mock';
import type {
  DigilockerResultOutcome,
  DigilockerSessionResult,
  CasparserError,
} from '@/lib/casparser/types';

export { digilockerMockEnabled, isHttpsRedirect };

type MockStatus = 'created' | 'succeeded' | 'denied';

interface MockSession {
  status: MockStatus;
}

const sessions = new Map<string, MockSession>();

const UNAVAILABLE_KEY =
  'CASPARSER_API_KEY is not set. Paste your Pro key in web/.env.local, or enter details by hand.';

export function casparserKeyMissingMessage(): string {
  return UNAVAILABLE_KEY;
}

export function createMockCasparserDigilockerSession(
  redirectUrl: string,
): DigilockerSessionResult {
  const sessionId = `cp_mock_${crypto.randomUUID()}`;
  sessions.set(sessionId, { status: 'created' });

  let authorizationUrl: string;
  try {
    const target = new URL(redirectUrl);
    target.searchParams.set('casparser_digilocker_mock', 'consent');
    target.searchParams.set('casparser_session', sessionId);
    authorizationUrl = target.toString();
  } catch {
    authorizationUrl = `${redirectUrl}?casparser_digilocker_mock=consent&casparser_session=${encodeURIComponent(sessionId)}`;
  }

  return {
    ok: true,
    sessionId,
    authorizationUrl,
    mock: true,
  };
}

export function grantMockCasparserDigilockerConsent(
  sessionId: string,
  decision: 'succeeded' | 'denied' = 'succeeded',
): { ok: true; sessionId: string; status: string } | CasparserError {
  const row = sessions.get(sessionId);
  if (!row) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'Unknown DigiLocker mock session. Connect again, or enter details by hand.',
    };
  }
  row.status = decision;
  return { ok: true, sessionId, status: decision };
}

export function mockCasparserDigilockerResult(
  sessionId: string,
): DigilockerResultOutcome {
  const row = sessions.get(sessionId);
  if (!row) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'Unknown DigiLocker mock session. Enter identity by hand.',
    };
  }
  if (row.status !== 'succeeded') {
    return {
      ok: false,
      code: 'BAD_REQUEST',
      message: `DigiLocker mock session is "${row.status}". Grant consent first.`,
    };
  }

  return {
    ok: true,
    sessionId,
    mock: true,
    identity: {
      name: 'ADITYA KUMAR SHARMA',
      dob: '1990-05-15',
      verified: { pan: 'AAAPA1234A', aadhaar: '123412341234' },
    },
    fetchedPan: {
      pan: 'AAAPA1234A',
      name: 'ADITYA KUMAR SHARMA',
      dob: '15-05-1990',
    },
  };
}

export function clearMockCasparserDigilockerSessions(): void {
  sessions.clear();
}
