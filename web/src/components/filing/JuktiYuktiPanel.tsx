'use client';

import { useMemo, useState } from 'react';

import { buildJuktiSnapshot } from '@/lib/jukti/guidance';
import { money, type FormType, type ReturnData, type ScheduleDef } from '@/lib/itr/types';
import { cn } from '@/lib/cn';

export function JuktiYuktiPanel({
  form,
  data,
  schedule,
}: {
  form: FormType;
  data: ReturnData;
  schedule: ScheduleDef | undefined;
}) {
  const [open, setOpen] = useState(true);
  const snap = useMemo(
    () => buildJuktiSnapshot({ form, data, schedule }),
    [form, data, schedule],
  );

  return (
    <section className="ntx-panel overflow-hidden" aria-label="Jukti Yukti, AI chartered accountant">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          <span className="block text-[var(--caption)] font-semibold tracking-[0.14em] text-[var(--text-muted)] uppercase">
            Jukti Yukti
          </span>
          <span className="text-[var(--body-sm)] font-semibold text-[var(--ink)]">
            AI chartered accountant
          </span>
        </span>
        <span className="font-[family-name:var(--font-figure)] text-[var(--caption)] text-[var(--text-muted)]">
          {open ? '\u2212' : '+'}
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-[var(--rule)] px-3 py-3">
          <p className="text-[var(--caption)] text-[var(--text-muted)]">
            Guidance for what to fill, what to leave blank, and when to validate. Not a substitute
            for a practising CA on contested positions.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[var(--radius-sm)] bg-[var(--neutral-50)] p-2">
              <p className="font-[family-name:var(--font-figure)] text-[var(--body-sm)] font-semibold text-[var(--notice)]">
                {snap.validation.blocking}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Cat A</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--neutral-50)] p-2">
              <p className="font-[family-name:var(--font-figure)] text-[var(--body-sm)] font-semibold text-[var(--ink)]">
                {snap.taxPayable == null ? '—' : money(snap.taxPayable)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Tax due</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--neutral-50)] p-2">
              <p className="font-[family-name:var(--font-figure)] text-[var(--body-sm)] font-semibold text-[var(--ink)]">
                {data.meta.regime === 'new' ? 'New' : 'Old'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Regime</p>
            </div>
          </div>

          {snap.regimeNote ? (
            <p className="text-[var(--caption)] text-[var(--text-secondary)]">{snap.regimeNote}</p>
          ) : null}

          <ul className="space-y-2">
            {snap.tips.map((tip) => (
              <li
                key={tip.id}
                className={cn(
                  'border-l-[3px] pl-2',
                  tip.tone === 'do' && 'border-[var(--seal)]',
                  tip.tone === 'skip' && 'border-[var(--notice)]',
                  tip.tone === 'check' && 'border-[var(--primary)]',
                  tip.tone === 'info' && 'border-[var(--rule)]',
                )}
              >
                <p className="text-[var(--caption)] font-semibold text-[var(--ink)]">{tip.title}</p>
                <p className="text-[var(--caption)] text-[var(--text-muted)]">{tip.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
