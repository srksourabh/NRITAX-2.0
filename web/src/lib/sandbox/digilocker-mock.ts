/**
 * Local DigiLocker consent stand-in when the Sandbox DigiLocker product is not
 * enabled (or DIGILOCKER_MOCK=1). Sessions live in module memory — fine for a
 * single Next.js process, never used in production unless the env flag is set.
 */

import type {
  DigilockerDocumentResult,
  DigilockerIdentity,
  DigilockerInitResult,
  DigilockerStatusResult,
  SandboxError,
} from '@/lib/sandbox/types';

export const DIGILOCKER_DISABLED_MESSAGE =
  'DigiLocker is not enabled on this Sandbox account (empty KYC response). Enable DigiLocker in the Sandbox dashboard, set DIGILOCKER_MOCK=1 for local consent debugging, or enter identity by hand.';

export const DIGILOCKER_HTTPS_MESSAGE =
  'DigiLocker requires an HTTPS redirect URL (not http://localhost). Set DIGILOCKER_REDIRECT_URL to a public https URL (ngrok or your deployed app), or set DIGILOCKER_MOCK=1 for local debugging. Enter identity by hand meanwhile.';

type MockStatus = 'created' | 'succeeded' | 'denied';

interface MockSession {
  status: MockStatus;
  createdAt: number;
}

const sessions = new Map<string, MockSession>();

export function digilockerMockEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const raw = env.DIGILOCKER_MOCK?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function isHttpsRedirect(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function createMockDigilockerSession(redirectUrl: string): DigilockerInitResult {
  const sessionId = `mock_${crypto.randomUUID()}`;
  sessions.set(sessionId, { status: 'created', createdAt: Date.now() });

  let authorizationUrl: string;
  try {
    const target = new URL(redirectUrl);
    target.searchParams.set('digilocker_mock', 'consent');
    target.searchParams.set('digilocker_session', sessionId);
    authorizationUrl = target.toString();
  } catch {
    authorizationUrl = `${redirectUrl}?digilocker_mock=consent&digilocker_session=${encodeURIComponent(sessionId)}`;
  }

  return { ok: true, sessionId, authorizationUrl };
}

export function mockDigilockerStatus(sessionId: string): DigilockerStatusResult | SandboxError {
  const row = sessions.get(sessionId);
  if (!row) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'Unknown DigiLocker mock session. Connect DigiLocker again, or enter details by hand.',
    };
  }
  return { ok: true, sessionId, status: row.status };
}

/** Marks a mock session as consented (or denied). */
export function grantMockDigilockerConsent(
  sessionId: string,
  decision: 'succeeded' | 'denied' = 'succeeded',
): DigilockerStatusResult | SandboxError {
  const row = sessions.get(sessionId);
  if (!row) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'Unknown DigiLocker mock session. Connect DigiLocker again, or enter details by hand.',
    };
  }
  row.status = decision;
  return { ok: true, sessionId, status: row.status };
}

const MOCK_PAN_IDENTITY: DigilockerIdentity = {
  pan: 'AAAPA1234A',
  fullName: 'ADITYA KUMAR SHARMA',
  firstName: 'ADITYA',
  middleName: 'KUMAR',
  surname: 'SHARMA',
  dateOfBirth: '1990-05-15',
};

const MOCK_AADHAAR_IDENTITY: DigilockerIdentity = {
  aadhaar: '123412341234',
  fullName: 'ADITYA KUMAR SHARMA',
  firstName: 'ADITYA',
  middleName: 'KUMAR',
  surname: 'SHARMA',
  dateOfBirth: '1990-05-15',
};

export function mockFetchDigilockerDocument(input: {
  sessionId: string;
  docType: string;
}): DigilockerDocumentResult | SandboxError {
  const row = sessions.get(input.sessionId);
  if (!row) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'Unknown DigiLocker mock session. Enter identity details by hand.',
    };
  }
  if (row.status !== 'succeeded') {
    return {
      ok: false,
      code: 'BAD_REQUEST',
      message: `DigiLocker mock session is "${row.status}". Grant consent first, or enter details by hand.`,
    };
  }

  const docType = input.docType.trim().toLowerCase();
  const identity =
    docType === 'pan'
      ? MOCK_PAN_IDENTITY
      : docType === 'aadhaar'
        ? MOCK_AADHAAR_IDENTITY
        : undefined;

  return {
    ok: true,
    docType,
    files: [],
    identity,
  };
}

/** Test helper — clears in-memory mock sessions. */
export function clearMockDigilockerSessions(): void {
  sessions.clear();
}
