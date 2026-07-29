'use client';

import { useCallback, useState } from 'react';

import type { MismatchDecision, MismatchRow, MismatchSeverity } from '@/lib/db/types';

export type MismatchItem = Pick<
  MismatchRow,
  'id' | 'code' | 'severity' | 'title' | 'detail' | 'decision' | 'declaredValue' | 'importedValue'
>;

type Props = {
  filingId: string;
  mismatches: MismatchItem[];
  onDecided?: (mismatchId: string, decision: MismatchDecision) => void;
  onNotice?: (message: string) => void;
};

function severityClass(severity: MismatchSeverity): string {
  return severity === 'blocking'
    ? 'border-rose-200 bg-rose-50 text-rose-900'
    : 'border-amber-200 bg-amber-50 text-amber-900';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function MismatchCenter({ filingId, mismatches, onDecided, onNotice }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [local, setLocal] = useState(mismatches);

  const decide = useCallback(
    async (mismatchId: string, decision: MismatchDecision) => {
      setBusyId(mismatchId);
      try {
        const res = await fetch('/api/mismatch/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filingId, mismatchId, decision }),
        });
        const json = (await res.json()) as { ok?: boolean; message?: string };
        if (!json.ok) {
          onNotice?.(json.message ?? 'Could not save decision.');
          return;
        }
        setLocal((prev) =>
          prev.map((m) => (m.id === mismatchId ? { ...m, decision } : m)),
        );
        onDecided?.(mismatchId, decision);
      } catch {
        onNotice?.('Could not save decision. Try again.');
      } finally {
        setBusyId(null);
      }
    },
    [filingId, onDecided, onNotice],
  );

  if (local.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        No mismatches between your return and imported sources.
      </p>
    );
  }

  const openCount = local.filter((m) => m.decision === 'open').length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {openCount} open mismatch{openCount === 1 ? '' : 'es'} — review declared vs imported values.
      </p>
      <ul className="space-y-2">
        {local.map((m) => (
          <li
            key={m.id}
            className={`rounded-lg border p-3 text-sm ${severityClass(m.severity)}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{m.title}</p>
                {m.detail ? <p className="mt-1 opacity-80">{m.detail}</p> : null}
                <p className="mt-2 text-xs opacity-70">
                  Declared: {formatValue(m.declaredValue)} · Imported: {formatValue(m.importedValue)}
                </p>
              </div>
              <span className="rounded px-2 py-0.5 text-xs uppercase tracking-wide opacity-80">
                {m.decision}
              </span>
            </div>
            {m.decision === 'open' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void decide(m.id, 'accepted')}
                  className="rounded-md bg-white/80 px-3 py-1 text-xs font-medium hover:bg-white disabled:opacity-50"
                >
                  Accept imported
                </button>
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void decide(m.id, 'overridden')}
                  className="rounded-md bg-white/80 px-3 py-1 text-xs font-medium hover:bg-white disabled:opacity-50"
                >
                  Keep declared
                </button>
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void decide(m.id, 'deferred')}
                  className="rounded-md bg-white/80 px-3 py-1 text-xs font-medium hover:bg-white disabled:opacity-50"
                >
                  Defer
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
