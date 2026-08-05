'use client';

import { useEffect, useRef, useState } from 'react';

import { importPrefillFile, PrefillFileError } from '@/lib/eri/prefill-file';
import { ITD_PORTAL_HOME, ITD_PORTAL_LABEL } from '@/lib/itd/portal';
import { ASSESSMENT_YEAR, type FormType, type ReturnData } from '@/lib/itr/types';
import {
  isTerminalStatus,
  type PortalFetchPublicJob,
  type PortalFetchStatus,
} from '@/lib/portal-fetch/types';
import { cn } from '@/lib/cn';

type SoftJson = {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
};

const STEPS = [
  { id: 'ready', label: 'Ready' },
  { id: 'login', label: 'Sign in to portal' },
  { id: 'otp', label: 'OTP if asked' },
  { id: 'download', label: 'Download prefill' },
  { id: 'done', label: 'Fill your form' },
] as const;

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
    artifactJson: typeof json.artifactJson === 'string' ? json.artifactJson : undefined,
  };
}

function stepIndex(status: PortalFetchStatus | 'idle' | 'blocked' | 'error'): number {
  switch (status) {
    case 'idle':
    case 'blocked':
      return 0;
    case 'queued':
    case 'logging_in':
      return 1;
    case 'awaiting_otp':
    case 'needs_live_assist':
      return 2;
    case 'downloading':
      return 3;
    case 'succeeded':
      return 4;
    case 'failed':
    case 'timed_out':
    case 'error':
      return 1;
    default:
      return 0;
  }
}

function humanStatus(status: PortalFetchStatus | 'idle' | 'blocked' | 'error'): string {
  switch (status) {
    case 'idle':
      return 'Not started yet';
    case 'blocked':
      return 'Waiting on missing details';
    case 'queued':
      return 'Queued — opening a secure browser…';
    case 'logging_in':
      return 'Signing in to the Income Tax e-Filing portal…';
    case 'awaiting_otp':
      return 'Portal asked for OTP — enter the code sent to your registered mobile or email.';
    case 'needs_live_assist':
      return 'Need a moment of help — finish login in the live browser window.';
    case 'downloading':
      return 'Signed in. Downloading your pre-filled JSON…';
    case 'succeeded':
      return 'Prefill downloaded and applied to blank fields.';
    case 'failed':
      return 'Could not finish the portal visit.';
    case 'timed_out':
      return 'The portal visit timed out.';
    case 'error':
      return 'Something went wrong before we could open the portal.';
    default:
      return String(status);
  }
}

/**
 * Calm, always-visible portal automation card.
 * Makes every blocker and status change obvious — no silent failures.
 */
export function PortalAutomationCard({
  form,
  data,
  setData,
  setActiveId,
  onStatus,
  sessionSeed,
  autoStart = false,
}: {
  form: FormType;
  data: ReturnData;
  setData: (next: ReturnData | ((prev: ReturnData) => ReturnData)) => void;
  setActiveId: (id: string) => void;
  onStatus: (message: string | null) => void;
  sessionSeed?: {
    pan?: string;
    name?: string;
    dob?: string;
    password?: string;
    mobile?: string;
    consent?: boolean;
  };
  autoStart?: boolean;
}) {
  const identity = genIdentity(data);
  const [pan, setPan] = useState(sessionSeed?.pan || identity.pan);
  const [name, setName] = useState(sessionSeed?.name || identity.name);
  const [dob, setDob] = useState(sessionSeed?.dob || identity.dob);
  const [password, setPassword] = useState(sessionSeed?.password ?? '');
  const [mobile, setMobile] = useState(sessionSeed?.mobile ?? '');
  const [consent, setConsent] = useState(Boolean(sessionSeed?.consent));
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'blocked' | 'error' | PortalFetchStatus>('idle');
  const [detail, setDetail] = useState<string | null>(null);
  const [job, setJob] = useState<PortalFetchPublicJob | null>(null);
  const [manualFileNote, setManualFileNote] = useState<string | null>(null);
  const appliedRef = useRef<string | null>(null);
  const autoTriedRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const blockers: string[] = [];
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase())) {
    blockers.push('Enter a valid PAN (this is your e-Filing User ID).');
  }
  if (!name.trim()) blockers.push('Enter your name as on the e-Filing portal.');
  if (!dob.trim()) blockers.push('Enter your date of birth.');
  if (!password) blockers.push('Enter your e-Filing password.');
  if (mobile.trim() && !/^\d{10}$/.test(mobile.trim())) {
    blockers.push(
      'If you enter a mobile, use 10 Indian digits. Leave blank for overseas numbers or email OTP.',
    );
  }
  if (!consent) blockers.push('Confirm you authorise a one-time portal visit for this session.');

  const canStart =
    blockers.length === 0 && !busy && (!job || isTerminalStatus(job.status));

  function announce(message: string, nextPhase: typeof phase = phase) {
    setDetail(message);
    setPhase(nextPhase);
    onStatus(message);
  }

  function applyArtifact(artifactJson: string, jobId: string) {
    if (appliedRef.current === jobId) return;
    try {
      const parsed = JSON.parse(artifactJson) as unknown;
      const imported = importPrefillFile(parsed, {
        form,
        expectPan: genIdentity(dataRef.current).pan || undefined,
      });
      setData((prev) => ({
        ...prev,
        fields: { ...imported.fields, ...prev.fields },
        tables: { ...imported.tables, ...prev.tables },
      }));
      appliedRef.current = jobId;
      setPassword('');
      setOtp('');
      setActiveId('GEN');
      announce(
        `Visited the Income Tax portal and applied ${imported.matched} prefill values. Review Part A, then continue schedule by schedule.`,
        'succeeded',
      );
    } catch (error) {
      appliedRef.current = jobId;
      announce(
        error instanceof PrefillFileError
          ? `Portal visit finished, but the file could not be read: ${error.message}`
          : 'Portal visit finished, but the prefill file could not be mapped. Upload JSON manually.',
        'failed',
      );
    }
  }

  function ingestJob(next: PortalFetchPublicJob) {
    setJob(next);
    setPhase(next.status);
    const line = next.message
      ? `${humanStatus(next.status)} ${next.message}`
      : humanStatus(next.status);
    setDetail(line);
    onStatus(line);
    if (next.status === 'succeeded' && next.artifactJson) {
      applyArtifact(next.artifactJson, next.id);
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
          if (ticks >= 2) {
            announce(
              json.message ??
                'Lost contact with the portal worker. Try again, or upload prefill JSON manually.',
              'error',
            );
          }
          return;
        }
        ingestJob(next);
      } catch {
        if (!cancelled && ticks >= 2) {
          announce(
            'Could not reach the portal worker. Check your connection, or upload prefill JSON manually.',
            'error',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.status]);

  async function startFetch() {
    if (blockers.length > 0) {
      setPhase('blocked');
      announce(`Cannot visit the portal yet: ${blockers[0]}`, 'blocked');
      return;
    }
    setBusy(true);
    appliedRef.current = null;
    announce('Starting a secure browser visit to the Income Tax e-Filing portal…', 'queued');
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
        announce(
          json.message ??
            'Portal automation is not available right now (worker offline or not configured). Upload the prefill JSON from the e-Filing portal instead.',
          'error',
        );
        return;
      }
      ingestJob(next);
    } catch {
      announce(
        'Network error before we could open the portal. Try again, or upload prefill JSON manually.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoStart || autoTriedRef.current) return;
    autoTriedRef.current = true;
    if (blockers.length > 0) {
      setPhase('blocked');
      setDetail(`Ready when you are — ${blockers[0]}`);
      onStatus(`Portal fetch waiting: ${blockers[0]}`);
      return;
    }
    void startFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function submitOtp() {
    if (!job || job.status !== 'awaiting_otp') return;
    const code = otp.trim();
    if (!/^\d{4,8}$/.test(code)) {
      announce('Enter the OTP from your registered mobile or email.', 'awaiting_otp');
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
        announce(json.message ?? 'OTP rejected. Try again or upload JSON manually.', 'error');
        return;
      }
      setOtp('');
      ingestJob(next);
    } catch {
      announce('Could not submit OTP. Upload prefill JSON manually.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onManualFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = importPrefillFile(parsed, {
        form,
        expectPan: pan || undefined,
      });
      setData((prev) => ({
        ...prev,
        fields: { ...imported.fields, ...prev.fields },
        tables: { ...imported.tables, ...prev.tables },
      }));
      setActiveId('GEN');
      setManualFileNote(`Manual prefill applied · ${imported.matched} values.`);
      announce(`Manual prefill applied · ${imported.matched} values mapped.`, 'succeeded');
    } catch (error) {
      const msg =
        error instanceof PrefillFileError
          ? error.message
          : 'That file is not a prefill JSON we can read.';
      setManualFileNote(msg);
      announce(msg, 'error');
    }
  }

  const activeStep = stepIndex(phase);
  const tone =
    phase === 'succeeded'
      ? 'ok'
      : phase === 'failed' || phase === 'timed_out' || phase === 'error' || phase === 'blocked'
        ? 'warn'
        : 'info';

  return (
    <section
      id="portal-automation"
      className={cn(
        'ntx-panel space-y-4 p-4 sm:p-5',
        tone === 'ok' && 'border-[var(--seal)]',
        tone === 'warn' && 'border-[var(--notice)]',
      )}
      aria-live="polite"
    >
      <div>
        <p className="text-[var(--caption)] font-semibold tracking-[0.14em] text-[var(--text-muted)] uppercase">
          Step 1 · Prefill
        </p>
        <h2 className="mt-1 text-[1.15rem] font-semibold text-[var(--ink)] sm:text-[length:var(--h2)]">
          Fetch your data from the Income Tax portal
        </h2>
        <p className="mt-1 max-w-2xl text-[var(--body-sm)] text-[var(--text-muted)]">
          Sign in with your PAN as User ID and e-Filing password. We open the official{' '}
          {ITD_PORTAL_LABEL} in a secure browser for this session only. Mobile is optional —
          only needed if the portal asks for OTP on an Indian number. Overseas numbers can be
          left blank; use email OTP or live assist when the portal asks.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Automation progress">
        {STEPS.map((s, i) => {
          const done = i < activeStep || phase === 'succeeded';
          const current = i === activeStep && phase !== 'succeeded';
          return (
            <li
              key={s.id}
              className={cn(
                'rounded-[var(--radius-sm)] px-2.5 py-1 text-[var(--caption)]',
                done && 'bg-[var(--seal)] text-white',
                current && 'bg-[var(--primary)] text-white',
                !done && !current && 'bg-[var(--neutral-100)] text-[var(--text-muted)]',
              )}
            >
              {i + 1}. {s.label}
            </li>
          );
        })}
      </ol>

      <div
        className={cn(
          'rounded-[var(--radius-md)] px-3 py-3 text-[var(--body-sm)]',
          tone === 'ok' && 'bg-[var(--neutral-50)] text-[var(--ink)]',
          tone === 'warn' && 'bg-[var(--neutral-50)] text-[var(--ink)]',
          tone === 'info' && 'bg-[var(--neutral-50)] text-[var(--ink)]',
        )}
      >
        <p className="font-semibold">{humanStatus(phase)}</p>
        {detail ? <p className="mt-1 text-[var(--text-secondary)]">{detail}</p> : null}
        {job?.panMasked ? (
          <p className="mt-1 font-[family-name:var(--font-figure)] text-[var(--caption)] text-[var(--text-muted)]">
            Job · {job.panMasked} · AY {job.assessmentYear}
          </p>
        ) : null}
      </div>

      {blockers.length > 0 && phase !== 'succeeded' ? (
        <ul className="list-disc space-y-1 pl-5 text-[var(--body-sm)] text-[var(--notice)]">
          {blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="ntx-label" htmlFor="auto-pan">
            PAN (e-Filing User ID)
          </label>
          <input
            id="auto-pan"
            className="ntx-input ntx-figure"
            maxLength={10}
            value={pan}
            disabled={busy && Boolean(job && !isTerminalStatus(job.status))}
            onChange={(e) =>
              setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
            }
          />
        </div>
        <div>
          <label className="ntx-label" htmlFor="auto-name">
            Full name
          </label>
          <input
            id="auto-name"
            className="ntx-input"
            value={name}
            disabled={busy && Boolean(job && !isTerminalStatus(job.status))}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="ntx-label" htmlFor="auto-dob">
            Date of birth
          </label>
          <input
            id="auto-dob"
            className="ntx-input"
            type="date"
            value={dob}
            disabled={busy && Boolean(job && !isTerminalStatus(job.status))}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div>
          <label className="ntx-label" htmlFor="auto-mobile">
            Registered mobile (optional)
          </label>
          <input
            id="auto-mobile"
            className="ntx-input ntx-figure"
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            disabled={busy && Boolean(job && !isTerminalStatus(job.status))}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Indian 10 digits, or leave blank"
          />
          <p className="mt-1 text-[var(--caption)] text-[var(--text-muted)]">
            Leave blank if you use an overseas number. If the portal asks for OTP, enter it below
            or open live assist.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="ntx-label" htmlFor="auto-password">
            e-Filing password
          </label>
          <input
            id="auto-password"
            className="ntx-input"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={busy && Boolean(job && !isTerminalStatus(job.status))}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-[var(--body-sm)] text-[var(--text-secondary)]">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={busy && Boolean(job && !isTerminalStatus(job.status))}
        />
        <span>
          I authorise a one-time browser visit to the Income Tax portal to download my prefill
          JSON. Password is not stored on NRITAX servers.
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ntx-btn ntx-btn-primary"
          disabled={!canStart}
          onClick={() => void startFetch()}
        >
          {busy && job && !isTerminalStatus(job.status)
            ? 'Visiting portal…'
            : 'Fetch from Income Tax portal'}
        </button>
        <a
          className="ntx-btn ntx-btn-secondary"
          href={ITD_PORTAL_HOME}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open portal myself
        </a>
      </div>

      {job?.status === 'awaiting_otp' ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-[var(--rule)] pt-3">
          <div className="min-w-[10rem] flex-1">
            <label className="ntx-label" htmlFor="auto-otp">
              OTP from Income Tax
            </label>
            <input
              id="auto-otp"
              className="ntx-input ntx-figure"
              inputMode="numeric"
              maxLength={8}
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

      {job?.liveViewUrl ? (
        <a
          className="ntx-btn ntx-btn-secondary"
          href={job.liveViewUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open live assist window
        </a>
      ) : null}

      <div className="border-t border-[var(--rule)] pt-3">
        <p className="text-[var(--caption)] text-[var(--text-muted)]">
          Prefer to download the file yourself? On the portal: e-File → Income Tax Return →
          download Prefill JSON, then choose it here.
        </p>
        <input
          type="file"
          accept="application/json,.json"
          className="mt-2 block w-full text-[var(--body-sm)]"
          onChange={(e) => void onManualFile(e.target.files?.[0] ?? null)}
        />
        {manualFileNote ? (
          <p className="mt-2 text-[var(--caption)] text-[var(--text-secondary)]">{manualFileNote}</p>
        ) : null}
      </div>
    </section>
  );
}
