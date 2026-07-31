/**
 * Filing journey route map — macro progress across the ITR filing flow.
 * Vertical on desktop; compact bar on mobile. Ledger register styling via .ntx-*.
 */

import { cn } from '@/lib/cn';

export const FILING_JOURNEY_STEPS = [
  'Your details',
  'Income',
  'Deductions',
  'Taxes paid',
  'Review',
  'Pay',
  'File and verify',
] as const;

export type FilingJourneyStepLabel = (typeof FILING_JOURNEY_STEPS)[number];

export type FilingWizardPhase = 'choose' | 'residency' | 'file' | 'regime';

const DEDUCTION_SCHEDULES = new Set(['VIA', 'S80G', 'S80D']);
const TAX_SCHEDULES = new Set(['TDS', 'IT', 'TI', 'TTI']);
const DETAIL_SCHEDULES = new Set(['GEN', 'VER']);

export type DeriveFilingJourneyInput = {
  step: FilingWizardPhase;
  activeScheduleId: string;
  hasValidationReport: boolean;
  canUpload: boolean;
  jsonDownloaded: boolean;
};

/**
 * Map wizard state → journey index (0..6).
 */
export function deriveFilingJourneyIndex(input: DeriveFilingJourneyInput): number {
  if (input.step === 'choose' || input.step === 'residency') return 0;
  if (input.jsonDownloaded) return 6;
  if (input.canUpload) return 5;
  if (input.hasValidationReport) return 4;

  if (input.step === 'regime') return 1;

  const id = input.activeScheduleId;
  if (DETAIL_SCHEDULES.has(id)) return 0;
  if (DEDUCTION_SCHEDULES.has(id)) return 2;
  if (TAX_SCHEDULES.has(id)) return 3;
  return 1;
}

/** Representative schedule (or action) when jumping to a journey stage. */
export function journeyTargetSchedule(index: number): string | null {
  switch (index) {
    case 0:
      return 'GEN';
    case 1:
      return 'CG';
    case 2:
      return 'VIA';
    case 3:
      return 'TDS';
    default:
      return null;
  }
}

export function FilingJourneyMap({
  current,
  onStep,
  compact = false,
}: {
  current: number;
  onStep?: (index: number) => void;
  compact?: boolean;
}) {
  const steps = FILING_JOURNEY_STEPS;
  const safeCurrent = Math.min(Math.max(0, current), steps.length - 1);

  if (compact) {
    const pct = ((safeCurrent + 1) / steps.length) * 100;
    return (
      <div className="mb-4 lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--label)] font-semibold text-[var(--ink)]">
            {steps[safeCurrent]}
          </span>
          <span className="font-[family-name:var(--font-figure)] text-[var(--statute)] text-[var(--text-muted)]">
            Step {safeCurrent + 1} of {steps.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={safeCurrent + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label="Filing journey progress"
          className="mt-2 h-1 overflow-hidden rounded-[var(--radius-full)] bg-[var(--neutral-200)]"
        >
          <div
            className="h-full bg-[var(--primary)] transition-[width] duration-[var(--motion-panel)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <nav
      aria-label="Filing journey"
      className="ntx-panel hidden p-3 lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-auto"
    >
      <p className="px-2 text-[var(--caption)] font-semibold tracking-[0.14em] text-[var(--text-muted)] uppercase">
        Filing route
      </p>
      <ol className="mt-3 list-none space-y-0 p-0">
        {steps.map((label, i) => {
          const done = i < safeCurrent;
          const active = i === safeCurrent;
          const clickable = Boolean(onStep) && (done || active);
          return (
            <li key={label} className="relative">
              {i < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-7 left-[17px] h-[calc(100%-8px)] w-px',
                    done ? 'bg-[var(--credit)]' : 'bg-[var(--rule)]',
                  )}
                />
              ) : null}
              <button
                type="button"
                disabled={!clickable}
                aria-current={active ? 'step' : undefined}
                onClick={clickable && onStep ? () => onStep(i) : undefined}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-[var(--radius-control)] px-2 py-2 text-left',
                  active && 'bg-[var(--info-tint)]',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-figure)] text-[10px]',
                    done && 'bg-[var(--credit)] text-[var(--surface)]',
                    active && !done && 'bg-[var(--primary)] text-[var(--surface)]',
                    !done && !active && 'bg-[var(--neutral-100)] text-[var(--text-muted)]',
                  )}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[var(--label)] leading-snug',
                    active && 'font-semibold text-[var(--primary)]',
                    done && !active && 'font-medium text-[var(--ink)]',
                    !done && !active && 'font-medium text-[var(--text-muted)]',
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
