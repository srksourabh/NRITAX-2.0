'use client';

import { useEffect, useRef, useState } from 'react';

import { importPrefillFile, PrefillFileError } from '@/lib/eri/prefill-file';
import { ASSESSMENT_YEAR, type FormType, type ReturnData } from '@/lib/itr/types';
import {
  isTerminalStatus,
  type PortalFetchPublicJob,
  type PortalFetchStatus,
} from '@/lib/portal-fetch/types';

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

async function readSoftJson(res: Response): Promise<SoftJson> {
  try {
    return (await res.json()) as SoftJson;
  } catch {
    return { ok: false, message: undefined };
  }
}

function statusLabel(status: PortalFetchStatus): string {
  switch (status) {
    case 'queued':
      return 'Queued…';
    case 'logging_in':
      return 'Signing in to e-Filing…';
    case 'awaiting_otp':
      return 'OTP required — enter the code sent to your registered mobile or email.';
    case 'needs_live_assist':
      return 'Live assist needed — finish login in the browser view, then confirm.';
    case 'downloading':
      return 'Downloading pre-filled data…';
    case 'succeeded':
      return 'Prefill downloaded.';
    case 'failed':
      return 'Fetch failed.';
    case 'timed_out':
      return 'Fetch timed out.';
    default:
      return status;
  }
}

function asJob(json: SoftJson): PortalFetchPublicJob | null {
  if (!json.ok || typeof json.id !== 'string' || typeof json.status !== 'string') {
    return null;
  }
  return {
    id: json.id,
    status: json.status as PortalFetchStatus,
    assessmentYear: String(json.assessmentYear ?? ASSESSMENT_YEAR),
    panMasked: String(json.panMasked ?? ''),
    message: typeof json.message === 'string' ? json.message : undefined,
    liveViewUrl: typeof json.liveViewUrl === 'string' ? json.liveViewUrl : undefined,
    artifactJson:
      typeof json.artifactJson === 'string' ? json.artifactJson : undefined,
  };
}

/**
 * Mode A→B portal prefill fetch: consent, credentials, OTP, live assist.
 * Soft-fails when the worker is down; manual JSON upload stays in EnrichmentPanels.
 */
export function PortalFetchPanel({
  form,
  data,
  setData,
  setActiveId,
  setNotice,
  sessionSeed,
  autoStart = false,
}: {
  form: FormType;
  data: ReturnData;
  setData: (next: ReturnData | ((prev: ReturnData) => ReturnData)) => void;
  setActiveId: (id: string) => void;
  setNotice: (message: string | null) => void;
  sessionSeed?: {
    pan?: string;
    name?: string;
    dob?: string;
    password?: string;
    mobile?: string;
    consent?: boolean;
  };
  /** Start fetch once when seed + consents are ready (session automation path). */
  autoStart?: boolean;
}) {
  const identity = genIdentity(data);
  const [panEdit, setPanEdit] = useState<string | null>(sessionSeed?.pan ?? null);
  const [nameEdit, setNameEdit] = useState<string | null>(sessionSeed?.name ?? null);
  const [dobEdit, setDobEdit] = useState<string | null>(sessionSeed?.dob ?? null);
  const pan = panEdit ?? identity.pan;
  const name = nameEdit ?? identity.name;
  const dob = dobEdit ?? identity.dob;
  const [password, setPassword] = useState(sessionSeed?.password ?? '');
  const [mobile, setMobile] = useState(sessionSeed?.mobile ?? '');
  const [consentFetch, setConsentFetch] = useState(Boolean(sessionSeed?.consent));
  const [consentLiability, setConsentLiability] = useState(Boolean(sessionSeed?.consent));
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<PortalFetchPublicJob | null>(null);
  const appliedArtifactRef = useRef<string | null>(null);
  const lastNoticeStatusRef = useRef<string | null>(null);
  const autoStartedRef = useRef(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const canStart =
    consentFetch &&
    consentLiability &&
    /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase()) &&
    name.trim().length > 0 &&
    dob.trim().length > 0 &&
    password.length > 0 &&
    (!mobile.trim() || /^\d{10}$/.test(mobile.trim())) &&
    !busy &&
    (!job || isTerminalStatus(job.status));

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (!canStart) return;
    autoStartedRef.current = true;
    void startFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, canStart]);

  function applyArtifact(artifactJson: string, jobId: string) {
    if (appliedArtifactRef.current === jobId) return;
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(artifactJson) as unknown;
      } catch {
        throw new PrefillFileError(
          'That file is not JSON we can read.',
          'NOT_JSON',
        );
      }
      const expectPan = genIdentity(dataRef.current).pan || undefined;
      const imported = importPrefillFile(parsed, { form, expectPan });
      setData((prev) => ({
        ...prev,
        fields: { ...imported.fields, ...prev.fields },
        tables: { ...imported.tables, ...prev.tables },
      }));
      appliedArtifactRef.current = jobId;
      setActiveId('GEN');
      setPassword('');
      setOtp('');
      setNotice(
        `Portal prefill applied · ${imported.matched} values mapped. Edit anything by hand.`,
      );
    } catch (error) {
      appliedArtifactRef.current = jobId;
      setNotice(
        error instanceof PrefillFileError
          ? error.message
          : 'Prefill downloaded but could not be read. Upload the JSON manually.',
      );
    }
  }

  function ingestJob(next: PortalFetchPublicJob) {
    setJob(next);
    if (next.status === 'succeeded' && next.artifactJson) {
      applyArtifact(next.artifactJson, next.id);
      lastNoticeStatusRef.current = next.status;
      return;
    }
    const statusChanged = lastNoticeStatusRef.current !== next.status;
    if (!statusChanged && !isTerminalStatus(next.status)) return;
    lastNoticeStatusRef.current = next.status;
    if (next.message) {
      setNotice(next.message);
    } else if (!isTerminalStatus(next.status)) {
      setNotice(statusLabel(next.status));
    } else if (next.status === 'failed' || next.status === 'timed_out') {
      setNotice(
        `${statusLabel(next.status)} Upload the prefill JSON manually, or try again.`,
      );
    }
  }

  useEffect(() => {
    if (!job || isTerminalStatus(job.status)) return;
    let cancelled = false;
    let ticks = 0;

    const tick = async () => {
      if (cancelled) return;
      ticks += 1;
      try {
        const res = await fetch(`/api/portal-fetch/${encodeURIComponent(job.id)}`);
        const json = await readSoftJson(res);
        if (cancelled) return;
        const next = asJob(json);
        if (!next) {
          if (ticks >= 3) {
            setNotice(
              json.message ??
                'Portal fetch status unavailable. Upload the prefill JSON manually.',
            );
          }
          return;
        }
        ingestJob(next);
      } catch {
        if (!cancelled && ticks >= 3) {
          setNotice(
            'Portal fetch is unreachable. Upload the prefill JSON manually.',
          );
        }
      }
    };

    void tick();
    const timer = window.setInterval(() => void tick(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // ingestJob uses latest setters; job.id drives the poll target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.status]);

  async function startFetch() {
    if (!canStart) return;
    setBusy(true);
    appliedArtifactRef.current = null;
    lastNoticeStatusRef.current = null;
    try {
      const res = await fetch('/api/portal-fetch/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan: pan.trim().toUpperCase(),
          name: name.trim(),
          dob: dob.trim(),
          password,
          mobile: mobile.trim().replace(/\D/g, ''),
          assessmentYear: data.meta.assessmentYear || ASSESSMENT_YEAR,
          consentFetch: true,
          consentLiability: true,
        }),
      });
      const json = await readSoftJson(res);
      const next = asJob(json);
      if (!next) {
        setNotice(
          json.message ??
            'Portal fetch unavailable. Download the prefill JSON from e-Filing and upload it below.',
        );
        return;
      }
      setPassword('');
      ingestJob(next);
    } catch {
      setNotice(
        'Portal fetch unavailable. Download the prefill JSON from e-Filing and upload it below.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    if (!job || job.status !== 'awaiting_otp') return;
    const code = otp.trim();
    if (!/^\d{4,8}$/.test(code)) {
      setNotice('Enter the OTP from your registered mobile or email.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/portal-fetch/${encodeURIComponent(job.id)}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code }),
      });
      const json = await readSoftJson(res);
      const next = asJob(json);
      if (!next) {
        setNotice(json.message ?? 'OTP rejected. Try again or upload JSON manually.');
        return;
      }
      setOtp('');
      ingestJob(next);
    } catch {
      setNotice('Could not submit OTP. Upload the prefill JSON manually.');
    } finally {
      setBusy(false);
    }
  }

  async function openLiveAssist() {
    if (!job) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/portal-fetch/${encodeURIComponent(job.id)}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open' }),
      });
      const json = await readSoftJson(res);
      const next = asJob(json);
      if (!next) {
        setNotice(json.message ?? 'Live assist unavailable. Upload JSON manually.');
        return;
      }
      ingestJob(next);
      if (next.liveViewUrl) {
        window.open(next.liveViewUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setNotice('Live assist unavailable. Upload the prefill JSON manually.');
    } finally {
      setBusy(false);
    }
  }

  async function signalLiveDone() {
    if (!job) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/portal-fetch/${encodeURIComponent(job.id)}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'done' }),
      });
      const json = await readSoftJson(res);
      const next = asJob(json);
      if (!next) {
        setNotice(json.message ?? 'Could not resume download. Upload JSON manually.');
        return;
      }
      ingestJob(next);
    } catch {
      setNotice('Could not resume download. Upload the prefill JSON manually.');
    } finally {
      setBusy(false);
    }
  }

  const inFlight = job && !isTerminalStatus(job.status);

  return (
    <div className="ntx-panel p-5 md:col-span-2 xl:col-span-2">
      <h2 className="text-[var(--h3)] font-semibold">
        Browser automation · fetch prefill JSON
      </h2>
      <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
        Optional: a cloud browser signs in to the e-Filing portal for this job only, downloads
        the department pre-filled JSON, and maps blank fields. Password and OTP stay in memory
        for the job, then are wiped. You can still upload a prefill JSON file by hand. After you
        finish the return, Download JSON and upload that file yourself on the portal — we do not
        file through a third-party ERI platform.
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3 text-[var(--body-sm)] text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="mt-1"
            checked={consentFetch}
            disabled={Boolean(inFlight)}
            onChange={(e) => setConsentFetch(e.target.checked)}
          />
          <span>
            I authorize NRITAX 2.0 to fetch my Income Tax Department pre-filled data
            for this assessment year using the details I enter below.
          </span>
        </label>
        <label className="flex items-start gap-3 text-[var(--body-sm)] text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="mt-1"
            checked={consentLiability}
            disabled={Boolean(inFlight)}
            onChange={(e) => setConsentLiability(e.target.checked)}
          />
          <span>
            I understand NRITAX 2.0 is not liable for portal or mapped data accuracy —
            I must verify every figure before filing.
          </span>
        </label>
      </div>

      <div className="ntx-field-grid mt-4">
        <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
          <label className="ntx-label" htmlFor="portal-fetch-pan">
            PAN
          </label>
          <input
            id="portal-fetch-pan"
            className="ntx-input ntx-figure"
            maxLength={10}
            autoComplete="off"
            spellCheck={false}
            disabled={Boolean(inFlight)}
            value={pan}
            onChange={(e) =>
              setPanEdit(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
            }
            placeholder="ABCDE1234F"
          />
        </div>
        <div className="ntx-field" style={{ gridColumn: 'span 5' }}>
          <label className="ntx-label" htmlFor="portal-fetch-name">
            Name as on e-Filing
          </label>
          <input
            id="portal-fetch-name"
            className="ntx-input"
            autoComplete="name"
            disabled={Boolean(inFlight)}
            value={name}
            onChange={(e) => setNameEdit(e.target.value)}
          />
        </div>
        <div className="ntx-field" style={{ gridColumn: 'span 3' }}>
          <label className="ntx-label" htmlFor="portal-fetch-dob">
            Date of birth
          </label>
          <input
            id="portal-fetch-dob"
            className="ntx-input"
            type="date"
            disabled={Boolean(inFlight)}
            value={dob}
            onChange={(e) => setDobEdit(e.target.value)}
          />
        </div>
        <div className="ntx-field" style={{ gridColumn: 'span 6' }}>
          <label className="ntx-label" htmlFor="portal-fetch-password">
            Income Tax portal password
          </label>
          <input
            id="portal-fetch-password"
            className="ntx-input"
            type="password"
            autoComplete="current-password"
            disabled={Boolean(inFlight)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="ntx-field" style={{ gridColumn: 'span 6' }}>
          <label className="ntx-label" htmlFor="portal-fetch-mobile">
            Registered mobile (optional)
          </label>
          <input
            id="portal-fetch-mobile"
            className="ntx-input ntx-figure"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            disabled={Boolean(inFlight)}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Leave blank if overseas"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="ntx-btn ntx-btn-primary"
          disabled={!canStart}
          onClick={() => void startFetch()}
        >
          {busy && !inFlight ? 'Starting…' : 'Fetch prefill from portal'}
        </button>
      </div>

      {job ? (
        <div className="mt-4 space-y-3 border-t border-[var(--rule)] pt-4">
          <p className="text-[var(--body-sm)] text-[var(--text-secondary)]">
            Status: {statusLabel(job.status)}
            {job.panMasked ? ` · ${job.panMasked}` : ''}
            {job.message ? ` — ${job.message}` : ''}
          </p>

          {job.status === 'awaiting_otp' ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[10rem] flex-1">
                <label className="ntx-label" htmlFor="portal-fetch-otp">
                  OTP
                </label>
                <input
                  id="portal-fetch-otp"
                  className="ntx-input ntx-figure"
                  inputMode="numeric"
                  maxLength={8}
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                />
              </div>
              <button
                type="button"
                className="ntx-btn ntx-btn-primary"
                disabled={busy || !/^\d{4,8}$/.test(otp)}
                onClick={() => void submitOtp()}
              >
                Submit OTP
              </button>
            </div>
          ) : null}

          {job.status === 'needs_live_assist' || job.liveViewUrl ? (
            <div className="flex flex-wrap gap-2">
              {job.liveViewUrl ? (
                <a
                  className="ntx-btn ntx-btn-secondary"
                  href={job.liveViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open live assist
                </a>
              ) : (
                <button
                  type="button"
                  className="ntx-btn ntx-btn-secondary"
                  disabled={busy}
                  onClick={() => void openLiveAssist()}
                >
                  Open live assist
                </button>
              )}
              {job.status === 'needs_live_assist' ? (
                <button
                  type="button"
                  className="ntx-btn ntx-btn-credit"
                  disabled={busy}
                  onClick={() => void signalLiveDone()}
                >
                  I finished login — continue
                </button>
              ) : null}
            </div>
          ) : null}

          {job.status === 'logging_in' || job.status === 'awaiting_otp' ? (
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary"
              disabled={busy}
              onClick={() => void openLiveAssist()}
            >
              Escalate to live assist
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
