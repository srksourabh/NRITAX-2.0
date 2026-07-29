'use client';

import { useEffect, useRef, useState } from 'react';

import { PortfolioImport } from '@/components/filing/PortfolioImport';
import type { ReturnData } from '@/lib/itr/types';

type SoftJson = {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
};

const SESSION_KEY = 'nritax.casparser.digilocker.sessionId';

async function readSoftJson(res: Response): Promise<SoftJson> {
  try {
    return (await res.json()) as SoftJson;
  } catch {
    return { ok: false };
  }
}

function fieldStr(data: ReturnData, ...keys: string[]): string {
  for (const key of keys) {
    const raw = data.fields[key];
    if (raw === null || raw === undefined) continue;
    const s = String(raw).trim();
    if (s) return s;
  }
  return '';
}

function genIdentity(data: ReturnData): { pan: string; dob: string } {
  return {
    pan: fieldStr(data, 'GEN.pan', 'GEN.PAN').toUpperCase(),
    dob: fieldStr(data, 'GEN.dob', 'GEN.DOB'),
  };
}

/**
 * Pro 200 auto-fill: DigiLocker (mobile optional) → Part A + PAN KYC,
 * then optional CDSL BO ID + OTP → Schedule CG.
 */
export function AutoFillPanel({
  data,
  setData,
  setActiveId,
  setNotice,
}: {
  data: ReturnData;
  setData: (next: ReturnData | ((prev: ReturnData) => ReturnData)) => void;
  setActiveId: (id: string) => void;
  setNotice: (message: string | null) => void;
}) {
  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mockPrompt, setMockPrompt] = useState(false);
  const [panStatus, setPanStatus] = useState<string | null>(null);
  const [boId, setBoId] = useState('');
  const [otp, setOtp] = useState('');
  const [cdslSessionId, setCdslSessionId] = useState<string | null>(null);
  const [cdslBusy, setCdslBusy] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const liveId = params.get('id')?.trim();
      const liveOk = params.get('success');
      const mockId = params.get('casparser_session')?.trim();
      const mockMode = params.get('casparser_digilocker_mock');
      const stored = sessionStorage.getItem(SESSION_KEY);
      const id = mockId || (liveOk === 'true' ? liveId : null) || stored;
      if (id) {
        setSessionId(id);
        sessionStorage.setItem(SESSION_KEY, id);
      }
      if (mockMode === 'consent' && id) {
        setMockPrompt(true);
        setNotice(
          'Mock DigiLocker: grant consent below to fill Part A, or enter identity by hand.',
        );
      } else if (liveOk === 'true' && id) {
        void applySession(id);
      }
    } catch {
      /* private mode */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applySession(id: string) {
    if (appliedRef.current === id) return;
    setBusy(true);
    try {
      const res = await fetch('/api/casparser/digilocker/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, data: dataRef.current }),
      });
      const json = await readSoftJson(res);
      if (!json.ok || !json.data) {
        setNotice(json.message ?? 'DigiLocker apply failed. Enter Part A by hand.');
        return;
      }
      appliedRef.current = id;
      setData(json.data as ReturnData);
      setActiveId('GEN');
      setMockPrompt(false);
      const status = json.panStatus as
        | { kycStatus?: string; kycCompliant?: boolean }
        | undefined;
      if (status?.kycStatus) {
        setPanStatus(
          `${status.kycStatus}${status.kycCompliant ? ' · compliant' : ''}`,
        );
      }
      setNotice(json.message ?? 'DigiLocker identity applied. Review Part A.');
      try {
        const url = new URL(window.location.href);
        [
          'success',
          'id',
          'documents',
          'has_verified_data',
          'state',
          'error',
          'casparser_digilocker_mock',
          'casparser_session',
        ].forEach((k) => url.searchParams.delete(k));
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      } catch {
        /* ignore */
      }
    } catch {
      setNotice('DigiLocker apply unavailable. Enter Part A by hand.');
    } finally {
      setBusy(false);
    }
  }

  async function startDigilocker() {
    setBusy(true);
    try {
      if (!consent) {
        setNotice('Tick consent to open DigiLocker, or enter Part A by hand.');
        return;
      }
      const res = await fetch('/api/casparser/digilocker/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          mobile: mobile.replace(/\D/g, '').slice(-10) || undefined,
          redirectUrl: `${window.location.origin}/filing/digilocker/callback`,
        }),
      });
      const json = await readSoftJson(res);
      if (!json.ok || typeof json.authorizationUrl !== 'string') {
        setNotice(json.message ?? 'DigiLocker unavailable. Enter Part A by hand.');
        return;
      }
      if (typeof json.sessionId === 'string') {
        setSessionId(json.sessionId);
        try {
          sessionStorage.setItem(SESSION_KEY, json.sessionId);
        } catch {
          /* ignore */
        }
      }
      if (json.mock) {
        setMockPrompt(true);
        setNotice(json.message ?? 'Mock DigiLocker ready. Grant consent below.');
      } else {
        window.open(json.authorizationUrl, '_blank', 'noopener,noreferrer');
        setNotice(
          json.message ??
            'DigiLocker opened. After consent you will return here to apply identity.',
        );
      }
    } catch {
      setNotice('DigiLocker unavailable. Enter Part A by hand.');
    } finally {
      setBusy(false);
    }
  }

  async function grantMock(decision: 'succeeded' | 'denied' = 'succeeded') {
    if (!sessionId) {
      setNotice('Start DigiLocker first.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/casparser/digilocker/mock-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, decision }),
      });
      const json = await readSoftJson(res);
      if (!json.ok) {
        setNotice(json.message ?? 'Mock consent failed.');
        return;
      }
      if (decision === 'succeeded') await applySession(sessionId);
      else {
        setMockPrompt(false);
        setNotice(json.message ?? 'Consent denied. Enter Part A by hand.');
      }
    } catch {
      setNotice('Mock DigiLocker unavailable.');
    } finally {
      setBusy(false);
    }
  }

  async function requestCdslOtp() {
    setCdslBusy(true);
    try {
      const id = genIdentity(dataRef.current);
      const pan = id.pan;
      const dob = id.dob;
      if (!pan || !dob) {
        setNotice('Fill PAN and DOB via DigiLocker (or Part A) before CDSL fetch.');
        return;
      }
      const digits = boId.replace(/\D/g, '');
      if (digits.length !== 16) {
        setNotice('Enter your 16-digit CDSL BO ID from the broker app.');
        return;
      }
      const res = await fetch('/api/casparser/cdsl/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan, boId: digits, dob }),
      });
      const json = await readSoftJson(res);
      if (!json.ok || typeof json.sessionId !== 'string') {
        setNotice(json.message ?? 'CDSL OTP failed. Upload a CAS PDF instead.');
        return;
      }
      setCdslSessionId(json.sessionId);
      setNotice(json.message ?? 'OTP sent. Enter it below (may take ~20s).');
    } catch {
      setNotice('CDSL OTP unavailable. Upload a CAS PDF instead.');
    } finally {
      setCdslBusy(false);
    }
  }

  async function verifyCdslOtp() {
    if (!cdslSessionId) {
      setNotice('Request the CDSL OTP first.');
      return;
    }
    setCdslBusy(true);
    try {
      const res = await fetch('/api/casparser/cdsl/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: cdslSessionId,
          otp: otp.trim(),
          data: dataRef.current,
        }),
      });
      const json = await readSoftJson(res);
      if (!json.ok || !json.data) {
        setNotice(json.message ?? 'CDSL verify failed. Upload a CAS PDF instead.');
        return;
      }
      setData(json.data as ReturnData);
      setActiveId('CG');
      setNotice(json.message ?? 'CAS applied to Schedule CG. Review carefully.');
    } catch {
      setNotice('CDSL verify unavailable. Upload a CAS PDF instead.');
    } finally {
      setCdslBusy(false);
    }
  }

  return (
    <div className="ntx-panel p-5 md:col-span-2 xl:col-span-3">
      <h2 className="text-[var(--h3)] font-semibold">
        Auto-fill · DigiLocker &amp; CDSL (Pro)
      </h2>
      <p className="mt-1 max-w-3xl text-[var(--body-sm)] text-[var(--text-muted)]">
        Ask for a mobile (optional), open DigiLocker, then we fill Part A and check
        PAN KYC status. Or use Portfolio Connect to import CAS / CDSL in one widget.
        Uses <code className="ntx-figure">CASPARSER_API_KEY</code>.
        Local mock DigiLocker works without HTTPS when <code className="ntx-figure">DIGILOCKER_MOCK=1</code>.
      </p>

      <div className="mt-4">
        <PortfolioImport
          data={data}
          setData={setData}
          setActiveId={setActiveId}
          setNotice={setNotice}
          prefill={{
            pan: genIdentity(data).pan || undefined,
            dob: genIdentity(data).dob || undefined,
            phone: mobile.length === 10 ? mobile : undefined,
          }}
        />
      </div>

      <hr className="ntx-double-rule mt-6 max-w-md" />

      <h3 className="mt-4 text-[var(--h3)] font-semibold">Or · DigiLocker identity</h3>

      <div className="ntx-field-grid mt-4">
        <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
          <label className="ntx-label" htmlFor="autofill-mobile">
            Mobile (optional)
          </label>
          <input
            id="autofill-mobile"
            className="ntx-input ntx-figure"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            placeholder="10-digit Indian mobile"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
          />
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 text-[var(--body-sm)] text-[var(--text-secondary)]">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I consent to fetching DigiLocker KYC and PAN status for filing this return.
          I can edit every field afterwards.
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="ntx-btn ntx-btn-primary"
          disabled={busy}
          onClick={() => void startDigilocker()}
        >
          {busy ? 'Working…' : 'Open DigiLocker'}
        </button>
        {sessionId && !mockPrompt ? (
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={busy}
            onClick={() => void applySession(sessionId)}
          >
            Apply DigiLocker result
          </button>
        ) : null}
      </div>

      {mockPrompt ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="ntx-btn ntx-btn-credit"
            disabled={busy}
            onClick={() => void grantMock('succeeded')}
          >
            Grant mock consent
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={busy}
            onClick={() => void grantMock('denied')}
          >
            Deny
          </button>
        </div>
      ) : null}

      {panStatus ? (
        <p className="mt-3 text-[var(--body-sm)] text-[var(--text-secondary)]">
          PAN KYC status: <span className="font-semibold text-[var(--ink)]">{panStatus}</span>
        </p>
      ) : null}

      <hr className="ntx-double-rule mt-6 max-w-md" />

      <h3 className="mt-4 text-[var(--h3)] font-semibold">Optional · CDSL CAS via OTP</h3>
      <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
        Needs PAN + DOB already in Part A, your 16-digit BO ID, and a real{' '}
        <code className="ntx-figure">CASPARSER_API_KEY</code>. Or upload a PDF below.
      </p>
      <div className="ntx-field-grid mt-3">
        <div className="ntx-field" style={{ gridColumn: 'span 6' }}>
          <label className="ntx-label" htmlFor="autofill-boid">
            BO ID (16 digits)
          </label>
          <input
            id="autofill-boid"
            className="ntx-input ntx-figure"
            inputMode="numeric"
            maxLength={16}
            value={boId}
            onChange={(e) => setBoId(e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="1234567890123456"
          />
        </div>
        <div className="ntx-field" style={{ gridColumn: 'span 3' }}>
          <label className="ntx-label" htmlFor="autofill-otp">
            SMS OTP
          </label>
          <input
            id="autofill-otp"
            className="ntx-input ntx-figure"
            inputMode="numeric"
            maxLength={8}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary"
          disabled={cdslBusy}
          onClick={() => void requestCdslOtp()}
        >
          {cdslBusy ? 'Requesting…' : 'Send CDSL OTP'}
        </button>
        <button
          type="button"
          className="ntx-btn ntx-btn-primary"
          disabled={cdslBusy || !cdslSessionId}
          onClick={() => void verifyCdslOtp()}
        >
          Verify OTP &amp; apply CAS
        </button>
      </div>
    </div>
  );
}
