'use client';

import { useEffect, useRef, useState } from 'react';

import { applyCasToReturn } from '@/lib/cas/apply-cas';
import type { CasParseResult } from '@/lib/cas/types';
import { importPrefillFile, PrefillFileError } from '@/lib/eri/prefill-file';
import {
  applyForm16ToReturn,
  applyForm26AsToReturn,
} from '@/lib/sandbox/apply-ocr';
import type { Form16Result, Form26AsResult, OcrKind } from '@/lib/sandbox/ocr-types';
import type { FormType, ReturnData } from '@/lib/itr/types';

const DIGI_SESSION_KEY = 'nritax.digilocker.sessionId';

const DIGI_READY = new Set([
  'succeeded',
  'success',
  'completed',
  'authenticated',
  'ready',
]);

type SoftJson = {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
};

function fieldStr(data: ReturnData, ...keys: string[]): string {
  for (const key of keys) {
    const raw = data.fields[key];
    if (raw === null || raw === undefined) continue;
    const s = String(raw).trim();
    if (s) return s;
  }
  return '';
}

function genIdentity(data: ReturnData): { pan: string; name: string; dob: string } {
  const pan = fieldStr(data, 'GEN.pan', 'GEN.PAN').toUpperCase();
  const first = fieldStr(data, 'GEN.firstName', 'GEN.FirstName');
  const surname = fieldStr(data, 'GEN.surname', 'GEN.SurNameOrOrgName');
  const dob = fieldStr(data, 'GEN.dob', 'GEN.DOB');
  return { pan, name: [first, surname].filter(Boolean).join(' '), dob };
}

function firstBankIfsc(data: ReturnData): string {
  const rows = data.tables.bank ?? data.tables.BankRows ?? [];
  const row = rows[0];
  if (!row) return '';
  return String(row.bIfsc ?? row.IFSC ?? '')
    .trim()
    .toUpperCase();
}

async function readSoftJson(res: Response): Promise<SoftJson> {
  try {
    return (await res.json()) as SoftJson;
  } catch {
    return { ok: false, message: undefined };
  }
}

function rememberDigiSession(sessionId: string | null) {
  try {
    if (sessionId) sessionStorage.setItem(DIGI_SESSION_KEY, sessionId);
    else sessionStorage.removeItem(DIGI_SESSION_KEY);
  } catch {
    /* private mode */
  }
}

function readStoredDigiSession(): string | null {
  try {
    return sessionStorage.getItem(DIGI_SESSION_KEY);
  } catch {
    return null;
  }
}

function clearDigiQueryParams() {
  try {
    const url = new URL(window.location.href);
    if (
      !url.searchParams.has('digilocker_mock') &&
      !url.searchParams.has('digilocker_session')
    ) {
      return;
    }
    url.searchParams.delete('digilocker_mock');
    url.searchParams.delete('digilocker_session');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}

export function EnrichmentPanels({
  form,
  data,
  setData,
  setActiveId,
  setNotice,
}: {
  form: FormType;
  data: ReturnData;
  setData: (next: ReturnData | ((prev: ReturnData) => ReturnData)) => void;
  setActiveId: (id: string) => void;
  setNotice: (message: string | null) => void;
}) {
  const [casBusy, setCasBusy] = useState(false);
  const [panBusy, setPanBusy] = useState(false);
  const [ifscBusy, setIfscBusy] = useState(false);
  const [digiBusy, setDigiBusy] = useState(false);
  const [ocr16Busy, setOcr16Busy] = useState(false);
  const [ocr26Busy, setOcr26Busy] = useState(false);
  const [ifscInput, setIfscInput] = useState('');
  const [ocr16Password, setOcr16Password] = useState('');
  const [digiSessionId, setDigiSessionId] = useState<string | null>(null);
  const [digiStatus, setDigiStatus] = useState<string | null>(null);
  const [digiMockPrompt, setDigiMockPrompt] = useState(false);
  const [digiPolling, setDigiPolling] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const appliedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('digilocker_session')?.trim() || null;
    const mockMode = params.get('digilocker_mock');
    const stored = readStoredDigiSession();
    const sessionId = fromQuery || stored;
    if (sessionId) {
      setDigiSessionId(sessionId);
      rememberDigiSession(sessionId);
    }
    if (mockMode === 'consent' && sessionId) {
      setDigiMockPrompt(true);
      setNotice(
        'Mock DigiLocker: grant consent below to fill blank Part A fields, or enter identity by hand.',
      );
    }
  }, [setNotice]);

  async function applyDigilockerSession(sessionId: string): Promise<boolean> {
    if (appliedSessionRef.current === sessionId) return true;
    const applyRes = await fetch('/api/sandbox/digilocker/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, data: dataRef.current }),
    });
    const applyJson = await readSoftJson(applyRes);
    if (!applyJson.ok || !applyJson.data) {
      setNotice(
        applyJson.message ??
          'DigiLocker apply unavailable. Enter identity details by hand.',
      );
      return false;
    }
    appliedSessionRef.current = sessionId;
    setData(applyJson.data as ReturnData);
    setActiveId('GEN');
    setDigiPolling(false);
    clearDigiQueryParams();
    const applied = Array.isArray(applyJson.fieldsApplied)
      ? applyJson.fieldsApplied.length
      : 0;
    const skipped = Array.isArray(applyJson.skipped) ? applyJson.skipped.length : 0;
    setNotice(
      applyJson.message ??
        `DigiLocker · ${applied} applied · ${skipped} skipped. Review Part A by hand.`,
    );
    return true;
  }

  async function pollDigilockerOnce(sessionId: string): Promise<'ready' | 'wait' | 'fail'> {
    const statusRes = await fetch(
      `/api/sandbox/digilocker/status?sessionId=${encodeURIComponent(sessionId)}`,
    );
    const statusJson = await readSoftJson(statusRes);
    if (!statusJson.ok) {
      setNotice(
        statusJson.message ??
          'DigiLocker status unavailable. Enter identity details by hand.',
      );
      return 'fail';
    }
    const status = String(statusJson.status ?? '').toLowerCase();
    setDigiStatus(status);
    if (status === 'denied' || status === 'failed' || status === 'expired') {
      setDigiPolling(false);
      setNotice(
        `DigiLocker ${status}. Enter identity details by hand, or connect again.`,
      );
      return 'fail';
    }
    if (DIGI_READY.has(status)) {
      const ok = await applyDigilockerSession(sessionId);
      return ok ? 'ready' : 'fail';
    }
    return 'wait';
  }

  useEffect(() => {
    if (!digiSessionId || digiMockPrompt || !digiPolling) return;
    let cancelled = false;
    let ticks = 0;

    const tick = async () => {
      if (cancelled) return;
      ticks += 1;
      try {
        const outcome = await pollDigilockerOnce(digiSessionId);
        if (outcome !== 'wait') return;
        if (ticks >= 40) {
          setDigiPolling(false);
          setNotice(
            'Still waiting for DigiLocker consent. Finish sign-in, click Check DigiLocker, or enter details by hand.',
          );
        }
      } catch {
        if (!cancelled) {
          setDigiPolling(false);
          setNotice('DigiLocker unavailable. Enter identity details by hand.');
        }
      }
    };

    void tick();
    const timer = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // pollDigilockerOnce closes over latest helpers via refs/state setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digiSessionId, digiMockPrompt, digiPolling]);


  function onPrefillFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importPrefillFile(reader.result, { form });
        setData((prev) => ({
          ...prev,
          fields: { ...imported.fields, ...prev.fields },
          tables: { ...imported.tables, ...prev.tables },
        }));
        setNotice(
          `Prefill applied · ${imported.matched} values mapped. Edit anything by hand.`,
        );
      } catch (error) {
        setNotice(
          error instanceof PrefillFileError
            ? error.message
            : 'Could not read that prefill file. Enter particulars by hand.',
        );
      }
    };
    reader.readAsText(file);
  }

  async function onCasFile(file: File | null) {
    if (!file) return;
    setCasBusy(true);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('financial_year', '2025-26');
      const res = await fetch('/api/cas/parse', { method: 'POST', body });
      const json = (await res.json()) as {
        ok: boolean;
        message?: string;
        result?: CasParseResult;
      };
      if (!json.ok || !json.result) {
        setNotice(
          json.message ??
            'CAS unavailable. Enter capital gains in Schedule CG by hand.',
        );
        return;
      }
      const applied = applyCasToReturn(data, json.result);
      setData(applied.data);
      setActiveId('CG');
      const warn =
        applied.warnings.length > 0
          ? ` · ${applied.warnings.slice(0, 2).join(' · ')}`
          : '';
      setNotice(
        `CAS applied to Schedule CG · ${applied.fieldsApplied} fields · ${applied.rowsApplied} Schedule 112A rows${warn}. Review and edit by hand if needed.`,
      );
    } catch {
      setNotice('CAS unavailable. Enter capital gains in Schedule CG by hand.');
    } finally {
      setCasBusy(false);
    }
  }

  async function verifyPan() {
    setPanBusy(true);
    try {
      const { pan, name, dob } = genIdentity(data);
      if (!pan || !name || !dob) {
        setNotice(
          'Enter PAN, name, and date of birth in Part A — General first, or fill them by hand.',
        );
        return;
      }
      const res = await fetch('/api/sandbox/pan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan, name, dateOfBirth: dob }),
      });
      const json = await readSoftJson(res);
      if (!json.ok) {
        setNotice(
          json.message ??
            'PAN verification unavailable. Enter identity details by hand.',
        );
        return;
      }
      const result = json.result as
        | { status?: string; nameMatch?: boolean; dobMatch?: boolean }
        | undefined;
      const bits = [
        json.message ?? 'PAN checked.',
        result?.status ? `Status: ${result.status}` : null,
        result?.nameMatch === false ? 'Name did not match' : null,
        result?.dobMatch === false ? 'DOB did not match' : null,
      ].filter(Boolean);

      try {
        const linkRes = await fetch('/api/sandbox/pan/aadhaar-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pan }),
        });
        const linkJson = await readSoftJson(linkRes);
        if (linkJson.ok) {
          bits.push(linkJson.message ?? 'Aadhaar link checked.');
        } else if (linkJson.message) {
          bits.push(linkJson.message);
        }
      } catch {
        /* optional follow-up */
      }

      setNotice(`${bits.join(' · ')}. You can still edit by hand.`);
    } catch {
      setNotice('PAN verification unavailable. Enter identity details by hand.');
    } finally {
      setPanBusy(false);
    }
  }

  async function checkIfsc() {
    setIfscBusy(true);
    try {
      const ifsc = (ifscInput || firstBankIfsc(data)).trim().toUpperCase();
      if (!ifsc) {
        setNotice(
          'Enter an IFSC here or in bank details, or fill the bank row by hand.',
        );
        return;
      }
      const res = await fetch('/api/sandbox/bank/ifsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ifsc }),
      });
      const json = await readSoftJson(res);
      if (!json.ok) {
        setNotice(
          json.message ??
            'IFSC lookup unavailable. Enter bank details by hand.',
        );
        return;
      }
      setNotice(
        `${json.message ?? 'IFSC looked up.'}. Confirm on the bank schedule by hand if needed.`,
      );
    } catch {
      setNotice('IFSC lookup unavailable. Enter bank details by hand.');
    } finally {
      setIfscBusy(false);
    }
  }

  async function connectDigilocker() {
    setDigiBusy(true);
    appliedSessionRef.current = null;
    try {
      const res = await fetch('/api/sandbox/digilocker/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirectUrl: `${window.location.origin}/filing`,
        }),
      });
      const json = await readSoftJson(res);
      if (!json.ok || typeof json.authorizationUrl !== 'string') {
        setNotice(
          json.message ??
            'DigiLocker unavailable. Enter identity details by hand.',
        );
        return;
      }
      if (typeof json.sessionId === 'string') {
        setDigiSessionId(json.sessionId);
        rememberDigiSession(json.sessionId);
        setDigiStatus('created');
      }
      const mock = Boolean(json.mock);
      if (mock) {
        setDigiMockPrompt(true);
        setDigiPolling(false);
        setNotice(
          json.message ??
            'Mock DigiLocker ready. Grant consent below to fill blank Part A, or enter identity by hand.',
        );
      } else {
        setDigiMockPrompt(false);
        window.open(json.authorizationUrl, '_blank', 'noopener,noreferrer');
        setDigiPolling(true);
        setNotice(
          json.message ??
            'DigiLocker opened. Finish consent there — we poll automatically, or click Check DigiLocker.',
        );
      }
    } catch {
      setNotice('DigiLocker unavailable. Enter identity details by hand.');
    } finally {
      setDigiBusy(false);
    }
  }

  async function grantMockConsent(decision: 'succeeded' | 'denied' = 'succeeded') {
    if (!digiSessionId) {
      setNotice('Connect DigiLocker first, or enter identity details by hand.');
      return;
    }
    setDigiBusy(true);
    try {
      const res = await fetch('/api/sandbox/digilocker/mock-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: digiSessionId, decision }),
      });
      const json = await readSoftJson(res);
      if (!json.ok) {
        setNotice(
          json.message ??
            'Mock consent failed. Enter identity details by hand.',
        );
        return;
      }
      setDigiStatus(String(json.status ?? decision));
      setDigiMockPrompt(false);
      if (decision === 'succeeded') {
        await applyDigilockerSession(digiSessionId);
      } else {
        setNotice(
          json.message ??
            'DigiLocker consent denied. Enter identity details by hand.',
        );
      }
    } catch {
      setNotice('Mock DigiLocker unavailable. Enter identity details by hand.');
    } finally {
      setDigiBusy(false);
    }
  }

  async function checkDigilocker() {
    if (!digiSessionId) {
      setNotice(
        'Connect DigiLocker first, or enter identity details by hand.',
      );
      return;
    }
    setDigiBusy(true);
    try {
      const outcome = await pollDigilockerOnce(digiSessionId);
      if (outcome === 'wait') {
        setDigiPolling(true);
        setNotice(
          `DigiLocker session is "${digiStatus ?? 'pending'}". Finish sign-in, wait for auto-check, or enter details by hand.`,
        );
      }
    } catch {
      setNotice('DigiLocker unavailable. Enter identity details by hand.');
    } finally {
      setDigiBusy(false);
    }
  }

  async function onOcrFile(kind: OcrKind, file: File | null, password?: string) {
    if (!file) return;
    const setBusy = kind === 'form16' ? setOcr16Busy : setOcr26Busy;
    setBusy(true);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('kind', kind);
      if (password) body.set('password', password);
      const res = await fetch('/api/sandbox/ocr', { method: 'POST', body });
      const json = await readSoftJson(res);
      if (!json.ok || !json.result) {
        setNotice(
          json.message ??
            'OCR unavailable. Enter salary / TDS figures by hand.',
        );
        return;
      }

      if (kind === 'form16') {
        const applied = applyForm16ToReturn(data, json.result as Form16Result);
        setData(applied.data);
        setActiveId('S');
        setNotice(
          `Form 16 applied · ${applied.applied.length} fields · ${applied.skipped.length} skipped. Review Schedule S by hand.`,
        );
      } else {
        const applied = applyForm26AsToReturn(data, json.result as Form26AsResult);
        setData(applied.data);
        setActiveId(form === 'ITR3' ? 'TDS1' : 'TDS');
        setNotice(
          `Form 26AS applied · ${applied.applied.length} fields · ${applied.skipped.length} skipped. Review TDS schedules by hand.`,
        );
      }
    } catch {
      setNotice('OCR unavailable. Enter salary / TDS figures by hand.');
    } finally {
      setBusy(false);
    }
  }

  const bankIfscHint = firstBankIfsc(data);

  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · ITD prefill JSON</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          From the Income Tax portal if you have a login. No login? Skip and type below.
        </p>
        <input
          type="file"
          accept="application/json,.json"
          className="mt-4 block w-full text-[var(--body-sm)]"
          onChange={(e) => onPrefillFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · Mutual fund CAS</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          CAMS / KFintech PDF. If parsing is down, enter gains in Schedule CG yourself.
        </p>
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={casBusy}
          className="mt-4 block w-full text-[var(--body-sm)]"
          onChange={(e) => void onCasFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · PAN verify</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Uses name, PAN and DOB from Part A — General. Never blocks the form.
        </p>
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary mt-4"
          disabled={panBusy}
          onClick={() => void verifyPan()}
        >
          {panBusy ? 'Verifying…' : 'Verify PAN'}
        </button>
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · IFSC check</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Reads the first bank row{bankIfscHint ? ` (${bankIfscHint})` : ''} or an IFSC you type.
        </p>
        <input
          className="ntx-input mt-3"
          placeholder="IFSC"
          maxLength={11}
          value={ifscInput}
          onChange={(e) => setIfscInput(e.target.value.toUpperCase())}
        />
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary mt-3"
          disabled={ifscBusy}
          onClick={() => void checkIfsc()}
        >
          {ifscBusy ? 'Looking up…' : 'Check IFSC'}
        </button>
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · DigiLocker</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Consent to share PAN / Aadhaar into blank Part A fields. Skip anytime.
          {digiStatus ? ` · status: ${digiStatus}` : ''}
          {digiPolling ? ' · polling…' : ''}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={digiBusy}
            onClick={() => void connectDigilocker()}
          >
            Connect DigiLocker
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={digiBusy || !digiSessionId}
            onClick={() => void checkDigilocker()}
          >
            Check DigiLocker
          </button>
        </div>
        {digiMockPrompt ? (
          <div className="mt-4 space-y-2 border-t border-[var(--rule)] pt-4">
            <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
              Local mock consent (DIGILOCKER_MOCK). Live DigiLocker needs the product
              enabled on Sandbox plus an HTTPS redirect.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ntx-btn ntx-btn-credit"
                disabled={digiBusy || !digiSessionId}
                onClick={() => void grantMockConsent('succeeded')}
              >
                Grant mock consent
              </button>
              <button
                type="button"
                className="ntx-btn ntx-btn-secondary"
                disabled={digiBusy || !digiSessionId}
                onClick={() => void grantMockConsent('denied')}
              >
                Deny
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · Form 16 OCR</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Salary PDF. Maps into Schedule S when blank. Password only if the PDF needs it.
        </p>
        <input
          className="ntx-input mt-3"
          type="password"
          placeholder="PDF password (optional)"
          value={ocr16Password}
          onChange={(e) => setOcr16Password(e.target.value)}
        />
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={ocr16Busy}
          className="mt-3 block w-full text-[var(--body-sm)]"
          onChange={(e) =>
            void onOcrFile('form16', e.target.files?.[0] ?? null, ocr16Password || undefined)
          }
        />
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · Form 26AS OCR</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Tax credit statement PDF. Maps into TDS schedules when blank.
        </p>
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={ocr26Busy}
          className="mt-4 block w-full text-[var(--body-sm)]"
          onChange={(e) => void onOcrFile('form26as', e.target.files?.[0] ?? null)}
        />
      </div>
    </section>
  );
}
