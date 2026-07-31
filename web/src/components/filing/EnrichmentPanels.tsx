'use client';

import { useEffect, useRef, useState } from 'react';

import { AutoFillPanel } from '@/components/filing/AutoFillPanel';
import { PortalFetchPanel } from '@/components/filing/PortalFetchPanel';
import { TaxImportPanel } from '@/components/filing/TaxImportPanel';
import { applyCasPipeline } from '@/lib/cas/pipeline';
import { casFailureMessage, resolveCasPdfPassword } from '@/lib/cas/password';
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
  const [casPassword, setCasPassword] = useState('');
  const [enrichBusy, setEnrichBusy] = useState(false);
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
  const [enrichPan, setEnrichPan] = useState('');
  const [enrichName, setEnrichName] = useState('');
  const [enrichDob, setEnrichDob] = useState('');
  const [enrichAadhaar, setEnrichAadhaar] = useState('');
  const [enrichIfsc, setEnrichIfsc] = useState('');
  const [enrichConsent, setEnrichConsent] = useState(false);
  const [casFetchBusy, setCasFetchBusy] = useState(false);
  const [casFetchPan, setCasFetchPan] = useState('');
  const [casFetchDob, setCasFetchDob] = useState('');
  const [casGenBusy, setCasGenBusy] = useState(false);
  const [casGenEmail, setCasGenEmail] = useState('');
  const [casGenPassword, setCasGenPassword] = useState('');
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailFiles, setGmailFiles] = useState<
    Array<{ messageId: string; filename: string; url: string; messageDate?: string; casType?: string }>
  >([]);
  const [gmailPassword, setGmailPassword] = useState('');
  const dataRef = useRef(data);
  dataRef.current = data;
  const appliedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    const id = genIdentity(data);
    if (!enrichPan && id.pan) setEnrichPan(id.pan);
    if (!enrichName && id.name) setEnrichName(id.name);
    if (!enrichDob && id.dob) setEnrichDob(id.dob);
    if (!casFetchPan && id.pan) setCasFetchPan(id.pan);
    if (!casFetchDob && id.dob) setCasFetchDob(id.dob);
    const email = fieldStr(data, 'GEN.email', 'GEN.EmailAddress');
    if (!casGenEmail && email) setCasGenEmail(email);
    const bankIfsc = firstBankIfsc(data);
    if (!enrichIfsc && bankIfsc) setEnrichIfsc(bankIfsc);
    if (!ifscInput && bankIfsc) setIfscInput(bankIfsc);
    // Only hydrate empty prompt fields from the return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmail = params.get('gmail');
    if (gmail === 'connected') {
      setGmailConnected(true);
      const email = params.get('gmail_email');
      if (email) setGmailEmail(email);
      setNotice('Gmail connected. List inbox CAS files, then apply one with your PDF password.');
    } else if (gmail === 'error') {
      const msg = params.get('gmail_msg') ?? 'connect_failed';
      setNotice(`Gmail connect failed (${msg}). Upload a CAS PDF by hand, or try again.`);
    }
  }, [setNotice]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/casparser/inbox/list', { method: 'POST' });
        const json = await readSoftJson(res);
        if (json.ok && json.connected) {
          setGmailConnected(true);
          if (typeof json.email === 'string') setGmailEmail(json.email);
        }
      } catch {
        /* soft-fail */
      }
    })();
  }, []);

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
      const { pan } = genIdentity(data);
      const password = resolveCasPdfPassword(pan, casPassword);
      const body = new FormData();
      body.set('file', file);
      body.set('financial_year', '2025-26');
      if (password) body.set('password', password);
      const res = await fetch('/api/cas/parse', { method: 'POST', body });
      const json = (await res.json()) as {
        ok: boolean;
        code?: string;
        message?: string;
        result?: CasParseResult;
      };
      if (!json.ok || !json.result) {
        setNotice(casFailureMessage(json.code, json.message));
        return;
      }
      const applied = applyCasPipeline({
        data,
        source: 'local-cas',
        casResult: json.result,
        financialYear: '2025-26',
      });
      if (!applied.ok) {
        setNotice(applied.message);
        return;
      }
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
      setNotice(casFailureMessage('SERVICE_UNAVAILABLE'));
    } finally {
      setCasBusy(false);
    }
  }

  async function fetchCasDemo() {
    setCasFetchBusy(true);
    try {
      const pan = (casFetchPan || genIdentity(data).pan).trim().toUpperCase();
      const dateOfBirth = (casFetchDob || genIdentity(data).dob).trim();
      if (!pan || !dateOfBirth) {
        setNotice('Enter PAN and date of birth to fetch the demo CAS, or upload a PDF.');
        return;
      }
      const res = await fetch('/api/cas/fetch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan,
          dateOfBirth,
          fullName: enrichName || genIdentity(data).name,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        message?: string;
        result?: CasParseResult;
      };
      if (!json.ok || !json.result) {
        setNotice(json.message ?? 'Demo CAS fetch unavailable. Upload a PDF or enter gains by hand.');
        return;
      }
      const applied = applyCasPipeline({
        data: dataRef.current,
        source: 'demo',
        casResult: json.result,
        financialYear: '2025-26',
      });
      if (!applied.ok) {
        setNotice(applied.message);
        return;
      }
      setData(applied.data);
      setActiveId('CG');
      setNotice(
        `${json.message ?? 'Demo CAS fetched.'} · ${applied.fieldsApplied} fields · ${applied.rowsApplied} Schedule 112A rows written.`,
      );
    } catch {
      setNotice('Demo CAS fetch unavailable. Upload a PDF or enter gains by hand.');
    } finally {
      setCasFetchBusy(false);
    }
  }

  async function requestDetailedCas() {
    setCasGenBusy(true);
    try {
      const { pan } = genIdentity(data);
      const email = casGenEmail.trim();
      const password = resolveCasPdfPassword(pan, casGenPassword);
      if (!email || !email.includes('@')) {
        setNotice('Enter the email registered with CAMS / KFintech.');
        return;
      }
      if (!password) {
        setNotice('Enter a PDF password (usually your PAN in Part A).');
        return;
      }
      const res = await fetch('/api/casparser/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, pan: pan || undefined }),
      });
      const json = await readSoftJson(res);
      if (!json.ok) {
        setNotice(
          json.message ??
            'Could not request a Detailed CAS. Upload a PDF from CAMS / KFintech, or enter gains by hand.',
        );
        return;
      }
      setNotice(
        json.message ??
          'Detailed CAS requested for FY 2025-26. Check that email in a few minutes, then upload the PDF below or import from Gmail.',
      );
    } catch {
      setNotice(
        'Could not request a Detailed CAS. Upload a PDF from CAMS / KFintech, or enter gains by hand.',
      );
    } finally {
      setCasGenBusy(false);
    }
  }

  async function connectGmail() {
    setGmailBusy(true);
    try {
      const res = await fetch('/api/casparser/inbox/connect', { method: 'POST' });
      const json = await readSoftJson(res);
      if (!json.ok || typeof json.oauthUrl !== 'string') {
        setNotice(
          json.message ??
            'Could not start Gmail connect. Try again later, or upload a CAS PDF by hand.',
        );
        return;
      }
      window.location.href = json.oauthUrl;
    } catch {
      setNotice('Could not start Gmail connect. Upload a CAS PDF by hand.');
    } finally {
      setGmailBusy(false);
    }
  }

  async function listGmailCas() {
    setGmailBusy(true);
    try {
      const res = await fetch('/api/casparser/inbox/list');
      const json = await readSoftJson(res);
      if (!json.ok) {
        setNotice(json.message ?? 'Could not list Gmail CAS files.');
        if (json.connected === false) setGmailConnected(false);
        return;
      }
      setGmailConnected(true);
      if (typeof json.email === 'string') setGmailEmail(json.email);
      const files = Array.isArray(json.files) ? json.files : [];
      setGmailFiles(
        files
          .filter(
            (f): f is Record<string, unknown> =>
              Boolean(f) && typeof f === 'object' && typeof (f as { url?: unknown }).url === 'string',
          )
          .map((f) => ({
            messageId: String(f.messageId ?? f.message_id ?? f.url),
            filename: String(f.filename ?? 'cas.pdf'),
            url: String(f.url),
            messageDate:
              typeof f.messageDate === 'string'
                ? f.messageDate
                : typeof f.message_date === 'string'
                  ? f.message_date
                  : undefined,
            casType:
              typeof f.casType === 'string'
                ? f.casType
                : typeof f.cas_type === 'string'
                  ? f.cas_type
                  : undefined,
          })),
      );
      setNotice(
        json.message ??
          (files.length
            ? `Found ${files.length} CAS file(s) in Gmail.`
            : 'No CAS files found. Request a Detailed CAS first, wait a few minutes, then list again.'),
      );
    } catch {
      setNotice('Could not list Gmail CAS files. Upload a PDF by hand.');
    } finally {
      setGmailBusy(false);
    }
  }

  async function applyGmailCas(pdfUrl: string) {
    setGmailBusy(true);
    try {
      const { pan } = genIdentity(data);
      const password = resolveCasPdfPassword(pan, gmailPassword);
      const res = await fetch('/api/casparser/inbox/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl,
          password: password || undefined,
          data: dataRef.current,
          financialYear: '2025-26',
        }),
      });
      const json = await readSoftJson(res);
      if (!json.ok || !json.data) {
        setNotice(
          json.message ??
            'Could not apply the Gmail CAS. Check the PDF password (usually PAN), or upload by hand.',
        );
        return;
      }
      setData(json.data as ReturnData);
      setActiveId('CG');
      setNotice(
        json.message ??
          `Applied Gmail CAS · ${String(json.fieldsApplied ?? 0)} fields · ${String(json.rowsApplied ?? 0)} Schedule 112A rows.`,
      );
    } catch {
      setNotice('Could not apply the Gmail CAS. Upload a PDF by hand.');
    } finally {
      setGmailBusy(false);
    }
  }

  async function disconnectGmail() {
    setGmailBusy(true);
    try {
      const res = await fetch('/api/casparser/inbox/disconnect', { method: 'POST' });
      const json = await readSoftJson(res);
      setGmailConnected(false);
      setGmailEmail(null);
      setGmailFiles([]);
      setNotice(json.message ?? 'Gmail disconnected.');
    } catch {
      setNotice('Could not disconnect Gmail. Try again.');
    } finally {
      setGmailBusy(false);
    }
  }

  async function enrichFromSandbox() {
    setEnrichBusy(true);
    try {
      const pan = enrichPan.trim().toUpperCase();
      const fullName = enrichName.trim();
      const dateOfBirth = enrichDob.trim();
      if (!pan || !fullName || !dateOfBirth) {
        setNotice(
          'Enter PAN, full name as on the PAN card, and date of birth. DigiLocker can fill these if you prefer not to type.',
        );
        return;
      }
      if (!enrichConsent) {
        setNotice(
          'Tick consent to verify identity with Sandbox, or enter Part A by hand.',
        );
        return;
      }

      const res = await fetch('/api/sandbox/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataRef.current,
          pan,
          fullName,
          dateOfBirth,
          aadhaar: enrichAadhaar.trim() || undefined,
          ifsc: (enrichIfsc || ifscInput).trim() || undefined,
          consent: true,
        }),
      });
      const json = await readSoftJson(res);
      if (!json.ok || !json.data) {
        if (json.data) setData(json.data as ReturnData);
        setNotice(
          json.message ??
            'Sandbox enrichment unavailable. Enter identity and bank details by hand.',
        );
        return;
      }
      setData(json.data as ReturnData);
      setActiveId('GEN');
      const applied = Array.isArray(json.fieldsApplied)
        ? json.fieldsApplied.length
        : 0;
      setNotice(
        json.message ??
          `Sandbox · ${applied} fields written. Review Part A by hand.`,
      );
    } catch {
      setNotice(
        'Sandbox enrichment unavailable. Enter identity and bank details by hand.',
      );
    } finally {
      setEnrichBusy(false);
    }
  }

  async function checkIfsc() {
    setIfscBusy(true);
    try {
      const ifsc = (ifscInput || enrichIfsc || firstBankIfsc(data)).trim().toUpperCase();
      if (!ifsc) {
        setNotice(
          'Enter an IFSC here or in bank details, or fill the bank row by hand.',
        );
        return;
      }
      const res = await fetch('/api/sandbox/bank/ifsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ifsc, data: dataRef.current, apply: true }),
      });
      const json = await readSoftJson(res);
      if (!json.ok) {
        setNotice(
          json.message ??
            'IFSC lookup unavailable. Enter bank details by hand.',
        );
        return;
      }
      if (json.data) {
        setData(json.data as ReturnData);
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
      <AutoFillPanel
        data={data}
        setData={setData}
        setActiveId={setActiveId}
        setNotice={setNotice}
      />

      <div className="md:col-span-2 xl:col-span-3">
        <TaxImportPanel
          filingId={null}
          onNotice={(m) => setNotice(m)}
          ensureFilingId={async () => {
            const res = await fetch('/api/filing', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data }),
            });
            const json = (await res.json()) as { ok?: boolean; filingId?: string; message?: string };
            if (!json.ok || !json.filingId) {
              setNotice(json.message ?? 'Save a draft with PAN before importing AIS / 26AS.');
              return null;
            }
            return json.filingId;
          }}
        />
      </div>

      <div className="ntx-panel p-5 md:col-span-2 xl:col-span-3">
        <h2 className="text-[var(--h3)] font-semibold">
          Fetch identity into the return (Sandbox)
        </h2>
        <p className="mt-1 max-w-3xl text-[var(--body-sm)] text-[var(--text-muted)]">
          Enter the minimum we need when Part A is empty: PAN, name as on the PAN
          card, and date of birth. Optional Aadhaar and IFSC fill link status and
          the first bank row. Identity helpers never need your Income Tax portal
          password.
        </p>
        <div className="ntx-field-grid mt-4">
          <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
            <label className="ntx-label" htmlFor="enrich-pan">
              PAN{!genIdentity(data).pan ? ' (required)' : ''}
            </label>
            <input
              id="enrich-pan"
              className="ntx-input ntx-figure"
              maxLength={10}
              autoComplete="off"
              spellCheck={false}
              value={enrichPan}
              onChange={(e) =>
                setEnrichPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
              }
              placeholder="ABCDE1234F"
            />
          </div>
          <div className="ntx-field" style={{ gridColumn: 'span 5' }}>
            <label className="ntx-label" htmlFor="enrich-name">
              Full name as on PAN
            </label>
            <input
              id="enrich-name"
              className="ntx-input"
              autoComplete="name"
              value={enrichName}
              onChange={(e) => setEnrichName(e.target.value)}
            />
          </div>
          <div className="ntx-field" style={{ gridColumn: 'span 3' }}>
            <label className="ntx-label" htmlFor="enrich-dob">
              Date of birth
            </label>
            <input
              id="enrich-dob"
              className="ntx-input"
              type="date"
              value={enrichDob}
              onChange={(e) => setEnrichDob(e.target.value)}
            />
          </div>
          <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
            <label className="ntx-label" htmlFor="enrich-aadhaar">
              Aadhaar (optional)
            </label>
            <input
              id="enrich-aadhaar"
              className="ntx-input ntx-figure"
              inputMode="numeric"
              maxLength={12}
              autoComplete="off"
              value={enrichAadhaar}
              onChange={(e) =>
                setEnrichAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))
              }
            />
          </div>
          <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
            <label className="ntx-label" htmlFor="enrich-ifsc">
              Refund IFSC (optional)
            </label>
            <input
              id="enrich-ifsc"
              className="ntx-input ntx-figure"
              maxLength={11}
              value={enrichIfsc}
              onChange={(e) => setEnrichIfsc(e.target.value.toUpperCase())}
              placeholder="HDFC0001234"
            />
          </div>
        </div>
        <label className="mt-4 flex items-start gap-3 text-[var(--body-sm)] text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="mt-1"
            checked={enrichConsent}
            onChange={(e) => setEnrichConsent(e.target.checked)}
          />
          <span>
            I consent to verifying these details with Sandbox KYC for filing this
            return. Results are written into blank Part A / bank fields; you can
            edit everything afterwards.
          </span>
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="ntx-btn ntx-btn-primary"
            disabled={enrichBusy}
            onClick={() => void enrichFromSandbox()}
          >
            {enrichBusy ? 'Fetching…' : 'Verify and fill Part A'}
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={digiBusy}
            onClick={() => void connectDigilocker()}
          >
            Or connect DigiLocker
          </button>
        </div>
      </div>

      <PortalFetchPanel
        form={form}
        data={data}
        setData={setData}
        setActiveId={setActiveId}
        setNotice={setNotice}
      />

      <div className="ntx-panel p-5 md:col-span-2 xl:col-span-1">
        <h2 className="text-[var(--h3)] font-semibold">Optional · ITD prefill JSON</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Prefer the fetch helper when available. Or download pre-filled data from the
          e-Filing portal yourself and upload the JSON here.
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[var(--body-sm)] text-[var(--text-secondary)]">
          <li>
            Open the{' '}
            <a
              className="underline underline-offset-2"
              href="https://www.incometax.gov.in/iec/foportal/"
              target="_blank"
              rel="noopener noreferrer"
            >
              e-Filing portal
            </a>{' '}
            and sign in.
          </li>
          <li>e-File → Income Tax Returns → File Income Tax Return (AY 2026-27).</li>
          <li>Download Prefill / pre-filled JSON when the portal offers it.</li>
          <li>Select that file below. Edit any field afterwards.</li>
        </ol>
        <p className="mt-3 text-[var(--caption)] text-[var(--text-muted)]">
          Full walkthrough:{' '}
          <a className="underline underline-offset-2" href="/#prefill">
            Prefill JSON guide
          </a>
          .
        </p>
        <input
          type="file"
          accept="application/json,.json"
          className="mt-4 block w-full text-[var(--body-sm)]"
          onChange={(e) => onPrefillFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="ntx-panel p-5 md:col-span-2">
        <h2 className="text-[var(--h3)] font-semibold">Demo · Fetch CAS by PAN &amp; DOB</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Enter PAN and date of birth. We return a specimen consolidated statement and write
          Schedule CG / 112A. Live CDSL OTP fetch needs a BO ID and SMS OTP. Or upload a real
          Detailed CAMS / KFintech PDF below.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="min-w-[10rem] flex-1">
            <label className="ntx-label" htmlFor="cas-fetch-pan">
              PAN
            </label>
            <input
              id="cas-fetch-pan"
              className="ntx-input ntx-figure"
              maxLength={10}
              value={casFetchPan}
              onChange={(e) =>
                setCasFetchPan(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
                )
              }
              placeholder="ABCDE1234F"
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="ntx-label" htmlFor="cas-fetch-dob">
              Date of birth
            </label>
            <input
              id="cas-fetch-dob"
              className="ntx-input"
              type="date"
              value={casFetchDob}
              onChange={(e) => setCasFetchDob(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          className="ntx-btn ntx-btn-primary mt-4"
          disabled={casFetchBusy}
          onClick={() => void fetchCasDemo()}
        >
          {casFetchBusy ? 'Fetching CAS…' : 'Fetch CAS and fill Schedule CG'}
        </button>
        <p className="mt-3 text-[var(--caption)] text-[var(--text-muted)]">
          Full-page walkthrough:{' '}
          <a className="underline underline-offset-2" href="/demo/cas">
            /demo/cas
          </a>
        </p>
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · Request Detailed MF CAS</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Asks CAS Parser Pro to mail a Detailed CAMS / KFintech statement for FY 2025-26
          (AY 2026-27) to the email registered with the RTA. The PDF usually arrives in a few
          minutes — then upload it below. Skip anytime and type gains in Schedule CG.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className="ntx-input"
            type="email"
            autoComplete="email"
            placeholder="RTA email (CAMS / KFintech)"
            value={casGenEmail}
            onChange={(e) => setCasGenEmail(e.target.value)}
          />
          <input
            className="ntx-input"
            type="password"
            autoComplete="off"
            placeholder="PDF password (defaults to PAN)"
            value={casGenPassword}
            onChange={(e) => setCasGenPassword(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary mt-4"
          disabled={casGenBusy}
          onClick={() => void requestDetailedCas()}
        >
          {casGenBusy ? 'Requesting…' : 'Request Detailed CAS'}
        </button>
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · Gmail CAS import</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Connect read-only Gmail via CAS Parser Pro to find CAMS / KFintech / CDSL / NSDL
          statements, then apply one into Schedule CG. Skip anytime and upload a PDF instead.
        </p>
        {gmailConnected ? (
          <p className="mt-2 text-[var(--body-sm)] text-[var(--credit-text)]">
            Connected{gmailEmail ? `: ${gmailEmail}` : ''}.
          </p>
        ) : (
          <p className="mt-2 text-[var(--body-sm)] text-[var(--text-muted)]">
            Not connected. Needs CAS Parser API key and the inbox token table in Supabase.
          </p>
        )}
        <div className="mt-3">
          <input
            className="ntx-input"
            type="password"
            autoComplete="off"
            placeholder="PDF password for apply (defaults to PAN)"
            value={gmailPassword}
            onChange={(e) => setGmailPassword(e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!gmailConnected ? (
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary"
              disabled={gmailBusy}
              onClick={() => void connectGmail()}
            >
              {gmailBusy ? '…' : 'Connect Gmail'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="ntx-btn ntx-btn-secondary"
                disabled={gmailBusy}
                onClick={() => void listGmailCas()}
              >
                {gmailBusy ? '…' : 'List inbox CAS'}
              </button>
              <button
                type="button"
                className="ntx-btn ntx-btn-secondary"
                disabled={gmailBusy}
                onClick={() => void disconnectGmail()}
              >
                Disconnect
              </button>
            </>
          )}
        </div>
        {gmailFiles.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {gmailFiles.map((f) => (
              <li
                key={f.messageId}
                className="flex flex-wrap items-center justify-between gap-2 border border-[var(--neutral-200)] p-3"
              >
                <span className="text-[var(--body-sm)] text-[var(--ink)]">
                  {f.filename}
                  {f.casType ? ` · ${f.casType}` : ''}
                  {f.messageDate ? ` · ${f.messageDate}` : ''}
                </span>
                <button
                  type="button"
                  className="ntx-btn ntx-btn-primary"
                  disabled={gmailBusy}
                  onClick={() => void applyGmailCas(f.url)}
                >
                  Apply to Schedule CG
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · Mutual fund CAS PDF</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Free open-source parse of a Detailed CAMS / KFintech statement for FY
          2025-26. Password defaults to your PAN in Part A. Summary or NSDL/CDSL
          holdings statements cannot fill Schedule CG.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-[var(--body-sm)] text-[var(--text-muted)]">
          <li>
            Request a Detailed CAS from{' '}
            <a
              className="underline underline-offset-2"
              href="https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement"
              target="_blank"
              rel="noreferrer"
            >
              CAMS
            </a>{' '}
            or{' '}
            <a
              className="underline underline-offset-2"
              href="https://mfs.kfintech.com/investor/General/ConsolidatedAccountStatement"
              target="_blank"
              rel="noreferrer"
            >
              KFintech
            </a>{' '}
            (email mailback).
          </li>
          <li>Upload the PDF below. Skip anytime and type gains in Schedule CG.</li>
        </ol>
        <input
          className="ntx-input mt-3"
          type="password"
          placeholder="PDF password (optional — defaults to PAN)"
          autoComplete="off"
          value={casPassword}
          onChange={(e) => setCasPassword(e.target.value)}
        />
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={casBusy}
          className="mt-3 block w-full text-[var(--body-sm)]"
          onChange={(e) => void onCasFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="ntx-panel p-5">
        <h2 className="text-[var(--h3)] font-semibold">Optional · IFSC check</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          Looks up the branch and writes IFSC / bank name into the first bank row.
          Reads the enrich field{bankIfscHint ? ` or ${bankIfscHint}` : ''} when blank.
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
          {ifscBusy ? 'Looking up…' : 'Check IFSC and fill bank'}
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
              Practice consent for local testing. Live DigiLocker needs the product
              enabled on your Sandbox account plus a public HTTPS redirect.
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
