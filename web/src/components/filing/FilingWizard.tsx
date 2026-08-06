'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { EnrichmentPanels } from '@/components/filing/EnrichmentPanels';
import { FieldHelp } from '@/components/filing/FieldHelp';
import {
  deriveFilingJourneyIndex,
  FilingJourneyMap,
  journeyTargetSchedule,
} from '@/components/filing/FilingJourneyMap';
import { FormSelectionStep } from '@/components/filing/FormSelectionStep';
import { JuktiYuktiPanel } from '@/components/filing/JuktiYuktiPanel';
import { PortalAutomationCard } from '@/components/filing/PortalAutomationCard';
import { PortalUploadPanel } from '@/components/filing/PortalUploadPanel';
import { PostValidatePanel } from '@/components/filing/PostValidatePanel';
import { RegimeComparePanel } from '@/components/filing/RegimeComparePanel';
import { RegimeStatusBanner } from '@/components/filing/RegimeStatusBanner';
import { ResidencyStep } from '@/components/filing/ResidencyStep';
import { AppShell } from '@/components/shell/AppShell';
import { cn } from '@/lib/cn';
import { buildReturnJson } from '@/lib/itr/build-json';
import { fieldHelpText, isImportantField } from '@/lib/itr/field-help';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3';
import type { ResidencyFacts } from '@/lib/itr/residency';
import { residencyLabel } from '@/lib/itr/residency';
import { sampleForForm } from '@/lib/itr/samples/sample-for-form';
import {
  ASSESSMENT_YEAR,
  emptyReturn,
  type FieldDef,
  type FieldValue,
  type FormType,
  type Regime,
  type ResidentialStatus,
  type ReturnData,
  type ScheduleDef,
  type TableRow,
  type ValidationReport,
} from '@/lib/itr/types';
import { isVisible } from '@/lib/itr/validate';
import { validateReturnStaged, type StagedValidationReport } from '@/lib/itr/validate-staged';
import {
  readFilingSession,
  splitFullName,
  type FilingSession,
} from '@/lib/session/filing-session';

type Step = 'choose' | 'residency' | 'file' | 'regime';

type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

function scrollToId(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function blankReturn(form: FormType): ReturnData {
  return emptyReturn({
    form,
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: todayIso(),
    dueDate: '2026-07-31',
  });
}

function schedulesFor(form: FormType): readonly ScheduleDef[] {
  return form === 'ITR3' ? ITR3_SCHEDULES : ITR2_SCHEDULES;
}

function downloadText(text: string, fileName: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function inputType(field: FieldDef): string {
  if (field.type === 'date') return 'date';
  if (field.type === 'email') return 'email';
  if (field.type === 'num' || field.type === 'dec') return 'number';
  return 'text';
}

function panFromReturn(data: ReturnData): string {
  const raw = data.fields['GEN.pan'] ?? data.fields['GEN.PAN'] ?? '';
  return String(raw).trim().toUpperCase();
}

function formatSavedAt(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function fieldFilled(value: FieldValue | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return Number.isFinite(value);
  return false;
}

function scheduleHasData(schedule: ScheduleDef, data: ReturnData): boolean {
  for (const section of schedule.sections) {
    for (const field of section.fields ?? []) {
      if (fieldFilled(data.fields[`${schedule.id}.${field.key}`])) return true;
    }
    for (const table of section.tables ?? []) {
      const rows = data.tables[table.key] ?? data.tables[`${schedule.id}.${table.key}`];
      if (rows && rows.length > 0) {
        const hasCell = rows.some((row) =>
          Object.values(row).some((cell) => fieldFilled(cell)),
        );
        if (hasCell) return true;
      }
    }
  }
  return false;
}

export function FilingWizard() {
  const [step, setStep] = useState<Step>('choose');
  const [picked, setPicked] = useState<FormType | null>(null);
  const [form, setForm] = useState<FormType>('ITR2');
  const [data, setData] = useState<ReturnData>(() => blankReturn('ITR2'));
  const [activeId, setActiveId] = useState('GEN');
  const [notice, setNotice] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [staged, setStaged] = useState<StagedValidationReport | null>(null);
  const [jsonDownloaded, setJsonDownloaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [filingSession, setFilingSession] = useState<FilingSession | null>(null);
  const [autoPrefill, setAutoPrefill] = useState(false);
  const skipAutosaveRef = useRef(false);
  const sessionAppliedRef = useRef(false);

  const schedules = useMemo(() => schedulesFor(form), [form]);
  const visibleSchedules = schedules.filter((s) => isVisible(s.showIf, data));
  const active = visibleSchedules.find((s) => s.id === activeId) ?? visibleSchedules[0];

  useEffect(() => {
    const session = readFilingSession();
    setFilingSession(session);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoPrefill') === '1') setAutoPrefill(true);
    } catch {
      /* ignore */
    }
    if (session?.form && !sessionAppliedRef.current) {
      sessionAppliedRef.current = true;
      setPicked(session.form);
      setStep('residency');
    }
  }, []);

  const journeyIndex = useMemo(
    () =>
      deriveFilingJourneyIndex({
        step,
        activeScheduleId: active?.id ?? activeId,
        hasValidationReport: Boolean(report),
        canUpload: Boolean(staged?.canUpload),
        jsonDownloaded,
      }),
    [step, active?.id, activeId, report, staged?.canUpload, jsonDownloaded],
  );

  function goToJourneyStep(index: number) {
    if (index > journeyIndex) return;

    if (index <= 0) {
      if (step === 'choose') return;
      if (step === 'file' || step === 'regime') {
        setActiveId('GEN');
        setStep('file');
        return;
      }
      setStep('residency');
      return;
    }

    if (index >= 1 && index <= 3) {
      setStep('file');
      const target = journeyTargetSchedule(index);
      if (target) setActiveId(target);
      return;
    }

    if (index === 4) {
      setStep('file');
      runValidation();
      return;
    }

    if (index === 5) {
      setStep('file');
      scrollToId('post-validate-panel');
      return;
    }

    setStep('file');
    scrollToId('post-validate-panel');
  }

  async function loadDraftFor(
    next: FormType,
  ): Promise<{ data: ReturnData; updatedAt?: string } | null> {
    try {
      const qs = new URLSearchParams({
        assessmentYear: ASSESSMENT_YEAR,
        form: next,
      });
      const res = await fetch(`/api/filing?${qs.toString()}`);
      if (res.status === 401) return null;
      const json = (await res.json()) as {
        ok?: boolean;
        filing?: { data: ReturnData; updatedAt?: string } | null;
      };
      if (!json.ok || !json.filing?.data) return null;
      return { data: json.filing.data, updatedAt: json.filing.updatedAt };
    } catch {
      return null;
    }
  }

  async function persistDraft(
    current: ReturnData,
  ): Promise<{ ok: boolean; message: string }> {
    const pan = panFromReturn(current);
    if (!pan) {
      const message = 'Enter a PAN in Part A before saving a draft.';
      setDraftStatus('error');
      setDraftMessage(message);
      return { ok: false, message };
    }
    setDraftStatus('saving');
    setDraftMessage('Saving…');
    try {
      const res = await fetch('/api/filing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: current }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
      };
      if (res.status === 401) {
        const message = json.message ?? 'Sign in to save a draft.';
        setDraftStatus('error');
        setDraftMessage(message);
        return { ok: false, message };
      }
      if (!json.ok) {
        const message = json.message ?? 'Could not save draft. Continue by hand.';
        setDraftStatus('error');
        setDraftMessage(message);
        return { ok: false, message };
      }
      setDraftStatus('saved');
      setDraftMessage('Draft saved');
      return { ok: true, message: 'Draft saved' };
    } catch {
      const message = 'Could not save draft. Continue by hand.';
      setDraftStatus('error');
      setDraftMessage(message);
      return { ok: false, message };
    }
  }

  async function startForm(
    next: FormType,
    residency?: { status: ResidentialStatus; facts: ResidencyFacts },
  ) {
    setForm(next);
    setActiveId('GEN');
    setReport(null);
    setDraftStatus('idle');
    setDraftMessage(null);
    skipAutosaveRef.current = true;

    const blank = blankReturn(next);
    const session = filingSession ?? readFilingSession();
    if (session) {
      const { first, surname } = splitFullName(session.fullName);
      blank.fields['GEN.FirstName'] = first;
      blank.fields['GEN.SurNameOrOrgName'] = surname;
      blank.fields['GEN.firstName'] = first;
      blank.fields['GEN.surname'] = surname;
      blank.fields['GEN.PAN'] = session.pan;
      blank.fields['GEN.pan'] = session.pan;
      blank.fields['GEN.DOB'] = session.dob;
      blank.fields['GEN.dob'] = session.dob;
      if (session.mobile) {
        blank.fields['GEN.MobileNo'] = session.mobile;
        blank.fields['GEN.mobile'] = session.mobile;
      }
    }
    if (residency) {
      blank.meta.residentialStatus = residency.status;
      blank.meta.residencyFacts = residency.facts;
      blank.fields['GEN.resStatus'] = residency.status;
      blank.fields['GEN.ResidentialStatus'] = residency.status;
    }
    setData(blank);
    setStep('file');

    const restored = await loadDraftFor(next);
    if (restored) {
      const merged = restored.data;
      if (session) {
        const { first, surname } = splitFullName(session.fullName);
        merged.fields = {
          ...merged.fields,
          'GEN.FirstName': merged.fields['GEN.FirstName'] || first,
          'GEN.SurNameOrOrgName': merged.fields['GEN.SurNameOrOrgName'] || surname,
          'GEN.PAN': merged.fields['GEN.PAN'] || session.pan,
          'GEN.pan': merged.fields['GEN.pan'] || session.pan,
          'GEN.DOB': merged.fields['GEN.DOB'] || session.dob,
          'GEN.dob': merged.fields['GEN.dob'] || session.dob,
        };
      }
      setData(merged);
      const when = formatSavedAt(restored.updatedAt);
      setNotice(
        when
          ? `Draft restored · saved ${when}. Portal automation uses your session password when available.`
          : 'Draft restored. Portal automation uses your session password when available.',
      );
      setDraftStatus('saved');
      setDraftMessage(when ? `Draft saved · ${when}` : 'Draft restored');
    } else {
      setNotice(
        session?.password
          ? `Identity loaded from your session. Browser automation will fetch prefill next — complete OTP if asked.`
          : residency
            ? `Residential status set to ${residencyLabel(residency.status)}. Helpers are optional — enter particulars by hand anytime.`
            : 'Helpers are optional. Skip prefill anytime and enter particulars by hand.',
      );
    }

    window.setTimeout(() => {
      skipAutosaveRef.current = false;
    }, 500);
  }

  /** One click on a form card opens residency, then that track. */
  async function openForm(next: FormType) {
    if (draftBusy) return;
    setPicked(next);
    setStep('residency');
  }

  async function confirmResidency(status: ResidentialStatus, facts: ResidencyFacts) {
    if (!picked || draftBusy) return;
    setDraftBusy(true);
    try {
      await startForm(picked, { status, facts });
    } finally {
      setDraftBusy(false);
    }
  }

  // Debounced autosave while filing (~2s after edits, only when PAN present)
  useEffect(() => {
    if (step !== 'file') return;
    if (skipAutosaveRef.current) return;
    if (!panFromReturn(data)) return;

    const timer = window.setTimeout(() => {
      if (skipAutosaveRef.current) return;
      void persistDraft(data);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [data, step]);

  // After each fill-up: quiet validation (Jukti Yukti reads the same report)
  useEffect(() => {
    if (step !== 'file') return;
    if (skipAutosaveRef.current) return;
    const timer = window.setTimeout(() => {
      try {
        const nextStaged = validateReturnStaged(data);
        setStaged(nextStaged);
        setReport(nextStaged.internal);
      } catch {
        /* keep prior report */
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [data, step, activeId]);

  function selectSchedule(id: string) {
    if (step === 'file' && id !== activeId) {
      try {
        const nextStaged = validateReturnStaged(data);
        setStaged(nextStaged);
        setReport(nextStaged.internal);
      } catch {
        /* ignore */
      }
    }
    setActiveId(id);
  }

  function setField(fq: string, value: FieldValue) {
    setData((prev) => {
      const fields = { ...prev.fields, [fq]: value };
      const meta = { ...prev.meta };
      if (fq === 'GEN.status' && (value === 'I' || value === 'H')) meta.status = value;
      if (
        (fq === 'GEN.resStatus' || fq === 'GEN.ResidentialStatus') &&
        (value === 'RES' || value === 'NOR' || value === 'NRI')
      ) {
        meta.residentialStatus = value;
        fields['GEN.resStatus'] = value;
        fields['GEN.ResidentialStatus'] = value;
      }
      if (fq === 'GEN.dob' && typeof value === 'string') meta.dateOfBirth = value;
      return { ...prev, fields, meta };
    });
  }

  function setTable(key: string, rows: TableRow[]) {
    setData((prev) => ({ ...prev, tables: { ...prev.tables, [key]: rows } }));
  }

  async function saveDraftNow() {
    setDraftBusy(true);
    const result = await persistDraft(data);
    setNotice(
      result.ok
        ? 'Draft saved. You can leave and restore it later.'
        : result.message,
    );
    setDraftBusy(false);
  }

  function runValidation() {
    try {
      const nextStaged = validateReturnStaged(data);
      setStaged(nextStaged);
      setReport(nextStaged.internal);
      setNotice(
        nextStaged.canUpload
          ? `Stages 1–2 clear. Digest ${nextStaged.digest.slice(0, 12)}…. Download JSON when ready.`
          : `${nextStaged.internal.blocking.length} Category A item(s) or schema issues remain. Draft JSON is still available.`,
      );
      window.setTimeout(() => {
        document.getElementById('validation-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotice(`Validation error: ${msg}`);
    }
  }

  function loadSampleData() {
    skipAutosaveRef.current = true;
    const sample = sampleForForm(form);
    setData(sample);
    setReport(null);
    setStaged(null);
    setActiveId('GEN');
    setNotice(
      form === 'ITR2'
        ? 'Loaded sample data · Priya Sharma (UAE NRI, ITR-2, salary + 112A LTCG). Run Validate, then Download JSON.'
        : 'Loaded sample data · Priya Sharma (UAE NRI, ITR-3 identity + salary heads). Review Schedule BP and run Validate before Download JSON.',
    );
    window.setTimeout(() => {
      skipAutosaveRef.current = false;
    }, 500);
  }

  function downloadJson() {
    const built = buildReturnJson(data);
    downloadText(JSON.stringify(built.json, null, 2), built.fileName);
    setJsonDownloaded(true);
    setNotice(
      `Downloaded ${built.fileName}. Upload at https://www.incometax.gov.in/iec/foportal/ → e-File → Upload JSON.`,
    );
  }

  function journeyChrome(right: ReactNode, body: ReactNode, opts?: { bare?: boolean }) {
    return (
      <AppShell right={right}>
        <div className="ntx-page pb-8">
          <FilingJourneyMap compact current={journeyIndex} />
          {opts?.bare ? (
            body
          ) : (
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
              <FilingJourneyMap current={journeyIndex} onStep={goToJourneyStep} />
              <div className="min-w-0">{body}</div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  if (step === 'choose') {
    return journeyChrome(
      <span className="ntx-badge ntx-badge-draft">AY {ASSESSMENT_YEAR}</span>,
      <FormSelectionStep busy={draftBusy} onOpenForm={(next) => void openForm(next)} />,
    );
  }

  if (step === 'residency') {
    return journeyChrome(
      <>
        <span className="ntx-badge ntx-badge-draft">{picked ?? '—'}</span>
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary"
          onClick={() => setStep('choose')}
        >
          Back
        </button>
      </>,
      <ResidencyStep
        busy={draftBusy}
        onBack={() => setStep('choose')}
        onConfirm={(status, facts) => void confirmResidency(status, facts)}
      />,
    );
  }

  if (step === 'regime') {
    return journeyChrome(
      <>
        <span className="ntx-badge ntx-badge-draft">{form}</span>
        <button type="button" className="ntx-btn ntx-btn-secondary" onClick={() => setStep('file')}>
          Back to form
        </button>
      </>,
      <RegimeComparePanel
        data={data}
        onBack={() => setStep('file')}
        onChooseRegime={(regime: Regime) => {
          setData((prev) => ({
            ...prev,
            meta: { ...prev.meta, regime },
            fields: { ...prev.fields, 'GEN.regime': regime === 'new' ? 'N' : 'O' },
          }));
          setNotice(
            regime === 'new'
              ? 'Filing under the new regime (115BAC).'
              : 'Filing under the old regime.',
          );
        }}
      />,
    );
  }

  const sessionSeed = filingSession
    ? {
        pan: filingSession.pan,
        name: filingSession.fullName,
        dob: filingSession.dob,
        password: filingSession.password,
        mobile: filingSession.mobile,
        consent: filingSession.consentAutomation,
        assessmentYear: filingSession.assessmentYear,
        formType: filingSession.form,
        politicallyExposed: filingSession.politicallyExposed,
        filingType: filingSession.filingType,
      }
    : undefined;

  return journeyChrome(
    <>
      <span className="ntx-badge ntx-badge-draft">
        {form} · AY {ASSESSMENT_YEAR}
      </span>
      <button type="button" className="ntx-btn ntx-btn-secondary" onClick={() => setStep('choose')}>
        Change form
      </button>
    </>,
    <>
      <div className="flex flex-col gap-3 border-b border-[var(--rule)] pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
        <div className="min-w-0">
          <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Your return
          </p>
          <h1 className="ntx-display-sm mt-1 text-[var(--ink)]">
            {form} · AY {ASSESSMENT_YEAR}
          </h1>
          <p className="mt-1 max-w-lg text-[var(--body-sm)] text-[var(--text-muted)]">
            Prefill first, then one schedule at a time. You only file when you are ready.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              className="ntx-btn ntx-btn-quiet"
              disabled={draftBusy}
              onClick={() => void saveDraftNow()}
            >
              {draftBusy ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" className="ntx-btn ntx-btn-secondary" onClick={runValidation}>
              Validate
            </button>
            <button type="button" className="ntx-btn ntx-btn-primary" onClick={downloadJson}>
              Download JSON
            </button>
          </div>
          {draftMessage ? (
            <p
              className={cn(
                'text-[var(--caption)] sm:text-right',
                draftStatus === 'error' ? 'text-[var(--notice)]' : 'text-[var(--text-muted)]',
              )}
            >
              {draftMessage}
            </p>
          ) : null}
          <details className="text-[var(--caption)] text-[var(--text-muted)] sm:text-right">
            <summary className="cursor-pointer select-none font-semibold text-[var(--primary)]">
              Developer tools
            </summary>
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary ntx-btn-compact mt-2"
              onClick={loadSampleData}
            >
              Load sample data
            </button>
          </details>
        </div>
      </div>

      <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
        <PortalAutomationCard
          form={form}
          data={data}
          setData={setData}
          setActiveId={setActiveId}
          onStatus={setNotice}
          onFormChange={(next) => {
            setForm(next);
            setPicked(next);
          }}
          sessionSeed={sessionSeed}
          autoStart={autoPrefill && Boolean(filingSession?.password)}
        />

        {notice ? (
          <p
            className="ntx-panel px-3 py-2.5 text-[var(--body-sm)] text-[var(--ink)] sm:px-4 sm:py-3"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        <RegimeStatusBanner data={data} onReview={() => setStep('regime')} compact />

        <div className="ntx-filing-calm">
          <aside className="ntx-filing-rail">
            <nav className="ntx-panel p-2" aria-label="Schedules">
              <p className="px-2 pb-2 text-[var(--caption)] font-semibold tracking-[0.14em] text-[var(--text-muted)] uppercase">
                Schedules
              </p>
              <div className="ntx-schedule-nav-scroll">
                {visibleSchedules.map((schedule) => {
                  const filled = scheduleHasData(schedule, data);
                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      className="ntx-nav-item"
                      aria-current={active?.id === schedule.id ? 'page' : undefined}
                      onClick={() => selectSchedule(schedule.id)}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block text-[10px] tracking-wide text-[var(--text-muted)]">
                            {schedule.no}
                          </span>
                          <span className="line-clamp-1">{schedule.name}</span>
                        </span>
                        <span
                          className={cn(
                            'ntx-schedule-dot mt-1 shrink-0',
                            filled ? 'ntx-schedule-dot-filled' : 'ntx-schedule-dot-empty',
                          )}
                          title={filled ? 'Has data' : 'Not started'}
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
            <div className="hidden lg:block">
              <JuktiYuktiPanel form={form} data={data} schedule={active} />
            </div>
          </aside>

          <div className="min-w-0 space-y-5 lg:space-y-6">
            <div className="lg:hidden">
              <JuktiYuktiPanel form={form} data={data} schedule={active} />
            </div>

            {active ? (
              <SchedulePanel
                schedule={active}
                data={data}
                onField={setField}
                onTable={setTable}
              />
            ) : null}

            {report ? (
              <div id="validation-report" className="ntx-panel space-y-3 p-4 sm:p-5">
                <h3 className="text-[var(--h3)] font-semibold">Validation report</h3>
                {staged ? (
                  <ul className="space-y-2 text-[var(--body-sm)]">
                    {staged.stages.map((s) => (
                      <li
                        key={s.stage}
                        className="flex flex-wrap items-start gap-2 rounded-[var(--radius-md)] border border-[var(--neutral-200)] p-3"
                      >
                        <span className="ntx-badge ntx-badge-draft">Stage {s.stage}</span>
                        <span className="font-medium text-[var(--ink)]">{s.name}</span>
                        <span
                          className={
                            s.status === 'pass'
                              ? 'ntx-badge ntx-badge-filed'
                              : s.status === 'fail'
                                ? 'ntx-badge ntx-badge-notice'
                                : 'ntx-badge ntx-badge-due'
                          }
                        >
                          {s.status}
                        </span>
                        <span className="w-full text-[var(--text-muted)]">{s.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
                  <span className="ntx-badge ntx-badge-notice mr-2">
                    {report.blocking.length} Cat A
                  </span>
                  <span className="ntx-badge ntx-badge-due mr-2">
                    {report.fieldErrors.length} field
                  </span>
                  <span className="ntx-badge ntx-badge-draft">
                    {report.advisory.length} advisory
                  </span>
                </p>
                <ul className="max-h-64 space-y-2 overflow-auto text-[var(--body-sm)]">
                  {[...report.blocking, ...report.fieldErrors, ...report.advisory]
                    .slice(0, 40)
                    .map((f, i) => (
                      <li
                        key={`${f.n}-${i}`}
                        className="border-l-[3px] border-[var(--primary)] pl-3"
                      >
                        <span className="font-medium">
                          {f.cat} · {f.field ?? f.schedule} · rule {f.n}
                        </span>
                        <span className="mt-0.5 block text-[var(--text-muted)]">{f.message}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}

            <div id="post-validate-panel" className="space-y-4">
              <PortalUploadPanel
                data={data}
                canUpload={Boolean(staged?.canUpload)}
                onNotice={(m) => {
                  setNotice(m);
                  setJsonDownloaded(true);
                }}
              />
              <PostValidatePanel data={data} onNotice={setNotice} />
            </div>

            <details className="ntx-panel p-3 sm:p-4">
              <summary className="cursor-pointer select-none text-[var(--body-sm)] font-semibold text-[var(--primary)]">
                More ways to import (AIS, Form 26AS, Excel)
              </summary>
              <div className="mt-3">
                <EnrichmentPanels
                  form={form}
                  data={data}
                  setData={setData}
                  setActiveId={setActiveId}
                  setNotice={setNotice}
                  layout="grid"
                  autoPrefill={false}
                  hidePortalFetch
                />
              </div>
            </details>
          </div>
        </div>
      </div>
    </>,
    { bare: true },
  );
}

function SchedulePanel({
  schedule,
  data,
  onField,
  onTable,
}: {
  schedule: ScheduleDef;
  data: ReturnData;
  onField: (fq: string, value: FieldValue) => void;
  onTable: (key: string, rows: TableRow[]) => void;
}) {
  return (
    <section className="ntx-panel space-y-5 p-4 sm:space-y-6 sm:p-5 lg:space-y-8 lg:p-6">
      <div>
        <h2 className="text-[1.25rem] font-semibold leading-tight text-[var(--ink)] sm:text-[length:var(--h2)]">
          {schedule.name}
        </h2>
        {schedule.sub ? (
          <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)] sm:mt-2">{schedule.sub}</p>
        ) : null}
        <hr className="ntx-double-rule mt-3 max-w-[8rem] sm:mt-5 sm:max-w-xs" />
      </div>
      {schedule.sections.map((section) => {
        if (!isVisible(section.showIf, data)) return null;
        return (
          <div key={section.key} className="space-y-3 sm:space-y-4">
            <h3 className="text-[var(--body)] font-semibold text-[var(--ink)] sm:text-[length:var(--h3)]">
              {section.title}
            </h3>
            {section.note ? (
              <p className="text-[var(--caption)] text-[var(--text-muted)] sm:text-[length:var(--body-sm)]">
                {section.note}
              </p>
            ) : null}
            <div className="ntx-field-grid">
              {(section.fields ?? []).map((field) => {
                if (!isVisible(field.showIf, data)) return null;
                const fq = `${schedule.id}.${field.key}`;
                return (
                  <FieldInput
                    key={fq}
                    field={field}
                    fq={fq}
                    value={data.fields[fq] ?? ''}
                    onChange={(v) => onField(fq, v)}
                  />
                );
              })}
            </div>
            {(section.tables ?? []).map((table) => {
              if (!isVisible(table.showIf, data)) return null;
              const rows = data.tables[table.key] ?? [{}];
              return (
                <div key={table.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[var(--body-sm)] font-semibold">{table.title}</h4>
                    <button
                      type="button"
                      className="shrink-0 text-[var(--body-sm)] font-semibold text-[var(--primary)]"
                      onClick={() => {
                        const max = table.maxRows ?? 99;
                        if (rows.length >= max) return;
                        onTable(table.key, [...rows, {}]);
                      }}
                    >
                      Add row
                    </button>
                  </div>
                  <div className="ntx-table-scroll">
                    <table className="w-full border-collapse text-[var(--body-sm)]">
                      <thead>
                        <tr className="border-b border-[var(--rule)] text-left">
                          {table.columns.map((col) => (
                            <th
                              key={col.key}
                              className="whitespace-nowrap px-1.5 py-2 font-medium text-[var(--text-muted)] sm:px-2"
                            >
                              <span className="inline-flex items-center gap-1">
                                {col.label}
                                {isImportantField(col) ? (
                                  <FieldHelp label={col.label} text={fieldHelpText(col)} field={col} fq={`${table.key}.${col.key}`} />
                                ) : null}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={cn(
                              'border-b border-[var(--rule)]',
                              rowIndex % 2 === 1 && 'bg-[var(--neutral-50)]',
                            )}
                          >
                            {table.columns.map((col) => (
                              <td key={col.key} className="px-1.5 py-1 align-top sm:px-2 sm:py-1.5">
                                <TableCell
                                  field={col}
                                  value={row[col.key] ?? ''}
                                  onChange={(v) => {
                                    const next = rows.map((r, i) =>
                                      i === rowIndex ? { ...r, [col.key]: v } : r,
                                    );
                                    onTable(table.key, next);
                                  }}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}

function FieldInput({
  field,
  fq,
  value,
  onChange,
}: {
  field: FieldDef;
  fq: string;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  const span = Math.min(12, Math.max(1, field.span ?? 4));
  const showHelp = isImportantField(field);
  const help = showHelp ? fieldHelpText(field) : '';

  return (
    <div
      className="ntx-field"
      style={{ gridColumn: `span ${span} / span ${span}` }}
    >
      <div className="ntx-field-label-row">
        <label className="ntx-label" htmlFor={fq}>
          {field.label}
          {field.required ? <span className="text-[var(--notice)]"> *</span> : null}
        </label>
        {showHelp ? <FieldHelp label={field.label} text={help} field={field} fq={fq} /> : null}
      </div>
      {field.options ? (
        <select
          id={fq}
          disabled={field.readOnly}
          className="ntx-select"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select</option>
          {field.options.map((opt) => (
            <option key={`${fq}-${opt.value}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fq}
          disabled={field.readOnly}
          className={cn('ntx-input', (field.type === 'num' || field.type === 'dec') && 'ntx-figure')}
          type={inputType(field)}
          inputMode={field.type === 'num' || field.type === 'dec' ? 'decimal' : undefined}
          maxLength={field.maxLen}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            if (field.type === 'num' || field.type === 'dec') {
              onChange(raw === '' ? '' : Number(raw));
              return;
            }
            onChange(
              field.type === 'pan' || field.type === 'tan' || field.type === 'ifsc'
                ? raw.toUpperCase()
                : raw,
            );
          }}
        />
      )}
    </div>
  );
}

function TableCell({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  if (field.options) {
    return (
      <select
        className="ntx-select min-w-[6.5rem]"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {field.options.map((opt) => (
          <option key={`${field.key}-${opt.value}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      className={cn(
        'ntx-input min-w-[5.5rem]',
        (field.type === 'num' || field.type === 'dec') && 'ntx-figure',
      )}
      type={inputType(field)}
      inputMode={field.type === 'num' || field.type === 'dec' ? 'decimal' : undefined}
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        if (field.type === 'num' || field.type === 'dec') {
          onChange(raw === '' ? '' : Number(raw));
          return;
        }
        onChange(raw);
      }}
    />
  );
}
