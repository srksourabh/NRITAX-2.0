'use client';

import { useState } from 'react';

/**
 * Minimal AIS / 26AS JSON import panel.
 * Expects a prior draft save (filingId). If missing, saves draft first via parent notice.
 */
export function TaxImportPanel({
  filingId,
  onNotice,
  ensureFilingId,
}: {
  filingId: string | null;
  onNotice: (message: string) => void;
  ensureFilingId: () => Promise<string | null>;
}) {
  const [kind, setKind] = useState<'ais' | 'form26as'>('form26as');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);

  async function importJson() {
    setBusy(true);
    try {
      let id = filingId;
      if (!id) id = await ensureFilingId();
      if (!id) return;

      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch {
        onNotice('Paste valid JSON from AIS / Form 26AS export.');
        return;
      }

      const res = await fetch('/api/filing/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filingId: id, kind, payload }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; importId?: string };
      onNotice(json.message ?? (json.ok ? 'Import saved.' : 'Import failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ntx-panel p-5">
      <h2 className="text-[var(--h3)] font-semibold">AIS / Form 26AS import</h2>
      <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
        Paste structured JSON exported from the Income Tax portal. We store a normalized extract for
        mismatch checks. Prefer exporting the file on the department site yourself.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={kind === 'form26as' ? 'ntx-btn ntx-btn-primary' : 'ntx-btn ntx-btn-secondary'}
          onClick={() => setKind('form26as')}
        >
          Form 26AS
        </button>
        <button
          type="button"
          className={kind === 'ais' ? 'ntx-btn ntx-btn-primary' : 'ntx-btn ntx-btn-secondary'}
          onClick={() => setKind('ais')}
        >
          AIS
        </button>
      </div>
      <textarea
        className="ntx-input mt-3 min-h-[8rem] w-full font-mono text-[var(--caption)]"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder='{"tds":[{"section":"192","amount":120000}]}'
      />
      <button
        type="button"
        className="ntx-btn ntx-btn-credit mt-3"
        disabled={busy || !raw.trim()}
        onClick={() => void importJson()}
      >
        {busy ? 'Importing…' : 'Import JSON'}
      </button>
    </div>
  );
}
