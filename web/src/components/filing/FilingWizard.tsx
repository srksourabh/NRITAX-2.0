'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { EnrichmentPanels } from '@/components/filing/EnrichmentPanels';
import { FormSelectionStep } from '@/components/filing/FormSelectionStep';
import { PostValidatePanel } from '@/components/filing/PostValidatePanel';
import { RegimeComparePanel } from '@/components/filing/RegimeComparePanel';
import { AppShell } from '@/components/shell/AppShell';
import { cn } from '@/lib/cn';
import { buildReturnJson } from '@/lib/itr/build-json';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3';
import { sampleNriPriyaItr2 } from '@/lib/itr/samples/nri-priya-itr2';
import {
  ASSESSMENT_YEAR,
  emptyReturn,
  type FieldDef,
  type FieldValue,
  type FormType,
  type Regime,
  type ReturnData,
  type ScheduleDef,
  type TableRow,
  type ValidationReport,
} from '@/lib/itr/types';
import { isVisible, validateReturn } from '@/lib/itr/validate';

type Step = 'choose' | 'file' | 'regime';

type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

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

export function FilingWizard() {
  const [step, setStep] = useState<Step>('choose');
  const [picked, setPicked] = useState<FormType | null>(null);
  const [form, setForm] = useState<FormType>('ITR2');
  const [data, setData] = useState<ReturnData>(() => blankReturn('ITR2'));
  const [activeId, setActiveId] = useState('GEN');
  const [notice, setNotice] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const skipAutosaveRef = useRef(false);

  const schedules = useMemo(() => schedulesFor(form), [form]);
  const visibleSchedules = schedules.filter((s) => isVisible(s.showIf, data));
  const active = visibleSchedules.find((s) => s.id === activeId) ?? visibleSchedules[0];

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

  async function startForm(next: FormType) {
    setForm(next);
    setActiveId('GEN');
    setReport(null);
    setDraftStatus('idle');
    setDraftMessage(null);
    skipAutosaveRef.current = true;

    setData(blankReturn(next));
    setStep('file');

    const restored = await loadDraftFor(next);
    if (restored) {
      setData(restored.data);
      const when = formatSavedAt(restored.updatedAt);
      setNotice(
        when
          ? `Draft restored · saved ${when}. Helpers stay optional — edit by hand anytime.`
          : 'Draft restored. Helpers stay optional — edit by hand anytime.',
      );
      setDraftStatus('saved');
      setDraftMessage(when ? `Draft saved · ${when}` : 'Draft restored');
    } else {
      setNotice(
        'Helpers are optional. Skip prefill, Sandbox or CAS anytime and enter particulars by hand.',
      );
    }

    window.setTimeout(() => {
      skipAutosaveRef.current = false;
    }, 500);
  }

  /** One click on a form card opens that track immediately. */
  async function openForm(next: FormType) {
    if (draftBusy) return;
    setPicked(next);
    setDraftBusy(true);
    try {
      await startForm(next);
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

  function setField(fq: string, value: FieldValue) {
    setData((prev) => {
      const fields = { ...prev.fields, [fq]: value };
      const meta = { ...prev.meta };
      if (fq === 'GEN.status' && (value === 'I' || value === 'H')) meta.status = value;
      if (fq === 'GEN.resStatus' && (value === 'RES' || value === 'NOR' || value === 'NRI')) {
        meta.residentialStatus = value;
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
    const next = validateReturn(data);
    setReport(next);
    setNotice(
      next.canUpload
        ? 'Category A clear. Download the filing JSON when ready.'
        : `${next.blocking.length} Category A item(s) would block portal upload. Draft JSON is still available.`,
    );
  }

  function loadPriyaSample() {
    if (form !== 'ITR2') return;
    skipAutosaveRef.current = true;
    setData(sampleNriPriyaItr2());
    setReport(null);
    setActiveId('GEN');
    setNotice(
      'Loaded sample · Priya Sharma (UAE NRI, ITR-2, salary + 112A LTCG). Run Validate to confirm Category A.',
    );
    window.setTimeout(() => {
      skipAutosaveRef.current = false;
    }, 500);
  }

  function downloadJson() {
    const built = buildReturnJson(data);
    downloadText(JSON.stringify(built.json, null, 2), built.fileName);
    setNotice(
      `Downloaded ${built.fileName}. Upload at incometax.gov.in → e-File → Upload JSON.`,
    );
  }

  if (step === 'choose') {
    return (
      <AppShell right={<span className="ntx-badge ntx-badge-draft">AY {ASSESSMENT_YEAR}</span>}>
        <FormSelectionStep busy={draftBusy} onOpenForm={(next) => void openForm(next)} />
      </AppShell>
    );
  }

  if (step === 'regime') {
    return (
      <AppShell
        right={
          <>
            <span className="ntx-badge ntx-badge-draft">{form}</span>
            <button type="button" className="ntx-btn ntx-btn-secondary" onClick={() => setStep('file')}>
              Back to form
            </button>
          </>
        }
      >
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
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      right={
        <>
          <span className="ntx-badge ntx-badge-draft">{form} · AY {ASSESSMENT_YEAR}</span>
          <button type="button" className="ntx-btn ntx-btn-secondary" onClick={() => setStep('choose')}>
            Change form
          </button>
        </>
      }
    >
      <main className="ntx-page">
        <div className="flex flex-col gap-4 border-b border-[var(--rule)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
              Filing workspace
            </p>
            <h1 className="ntx-display-sm mt-2 text-[var(--ink)]">{form} for AY {ASSESSMENT_YEAR}</h1>
            <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
              Prefill, DigiLocker, Sandbox and CAS are optional. Skip any helper — the schedules
              stay open for manual entry.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2 justify-end">
              {form === 'ITR2' ? (
                <button type="button" className="ntx-btn ntx-btn-secondary" onClick={loadPriyaSample}>
                  Load sample
                </button>
              ) : null}
              <button
                type="button"
                className="ntx-btn ntx-btn-secondary"
                disabled={draftBusy}
                onClick={() => void saveDraftNow()}
              >
                {draftBusy ? 'Saving…' : 'Save draft'}
              </button>
              <button type="button" className="ntx-btn ntx-btn-secondary" onClick={() => setStep('regime')}>
                Regime compare
              </button>
              <button type="button" className="ntx-btn ntx-btn-secondary" onClick={runValidation}>
                Validate
              </button>
              <button type="button" className="ntx-btn ntx-btn-credit" onClick={downloadJson}>
                Download JSON
              </button>
            </div>
            {draftMessage ? (
              <p
                className={cn(
                  'text-[var(--caption)] text-right',
                  draftStatus === 'error'
                    ? 'text-[var(--notice)]'
                    : 'text-[var(--text-muted)]',
                )}
              >
                {draftMessage}
              </p>
            ) : null}
          </div>
        </div>

        <EnrichmentPanels
          form={form}
          data={data}
          setData={setData}
          setActiveId={setActiveId}
          setNotice={setNotice}
        />

        {notice ? (
          <p className="ntx-panel mt-4 px-4 py-3 text-[var(--body-sm)] text-[var(--info-text)]">
            {notice}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="ntx-panel max-h-[70vh] overflow-auto p-2 lg:sticky lg:top-4">
            {visibleSchedules.map((schedule) => (
              <button
                key={schedule.id}
                type="button"
                className="ntx-nav-item"
                aria-current={active?.id === schedule.id ? 'page' : undefined}
                onClick={() => setActiveId(schedule.id)}
              >
                <span className="block text-[10px] tracking-wide text-[var(--text-muted)]">
                  {schedule.no}
                </span>
                {schedule.name}
              </button>
            ))}
          </nav>

          <div className="min-w-0 space-y-8">
            {active ? (
              <SchedulePanel
                schedule={active}
                data={data}
                onField={setField}
                onTable={setTable}
              />
            ) : null}

            {report ? (
              <div className="ntx-panel space-y-3 p-5">
                <h3 className="text-[var(--h3)] font-semibold">Validation report</h3>
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

            <PostValidatePanel data={data} onNotice={setNotice} />
          </div>
        </div>
      </main>
    </AppShell>
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
    <section className="ntx-panel space-y-8 p-6">
      <div>
        <h2 className="ntx-display-sm text-[var(--ink)]">{schedule.name}</h2>
        {schedule.sub ? (
          <p className="mt-2 text-[var(--text-muted)]">{schedule.sub}</p>
        ) : null}
        <hr className="ntx-double-rule mt-5 max-w-xs" />
      </div>
      {schedule.sections.map((section) => {
        if (!isVisible(section.showIf, data)) return null;
        return (
          <div key={section.key} className="space-y-4">
            <h3 className="text-[var(--h3)] font-semibold text-[var(--ink)]">{section.title}</h3>
            {section.note ? (
              <p className="text-[var(--body-sm)] text-[var(--text-muted)]">{section.note}</p>
            ) : null}
            <div className="grid grid-cols-12 gap-4">
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
                <div key={table.key} className="space-y-2 overflow-x-auto">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[var(--body-sm)] font-semibold">{table.title}</h4>
                    <button
                      type="button"
                      className="text-[var(--body-sm)] font-semibold text-[var(--primary)]"
                      onClick={() => {
                        const max = table.maxRows ?? 99;
                        if (rows.length >= max) return;
                        onTable(table.key, [...rows, {}]);
                      }}
                    >
                      Add row
                    </button>
                  </div>
                  <table className="min-w-full border-collapse text-[var(--body-sm)]">
                    <thead>
                      <tr className="border-b border-[var(--rule)] text-left">
                        {table.columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-2 py-2 font-medium text-[var(--text-muted)]"
                          >
                            {col.label}
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
                            <td key={col.key} className="px-2 py-1.5 align-top">
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
  const span = field.span ?? 4;
  return (
    <label className="block" style={{ gridColumn: `span ${span} / span ${span}` }}>
      <span className="ntx-label">
        {field.label}
        {field.required ? <span className="text-[var(--notice)]"> *</span> : null}
      </span>
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
      {field.hint ? (
        <span className="mt-1 block text-[var(--caption)] text-[var(--text-muted)]">
          {field.hint}
        </span>
      ) : null}
    </label>
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
        className="ntx-select min-w-[7rem]"
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
      className={cn('ntx-input min-w-[6rem]', (field.type === 'num' || field.type === 'dec') && 'ntx-figure')}
      type={inputType(field)}
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
