/**
 * CA workspace — list cases, detail view, status updates.
 */

import { getServiceClient } from '@/lib/db/client';
import type { CaFilingStatus, FilingEventRow, FilingRow, MismatchRow } from '@/lib/db/types';

export type CaCaseSummary = {
  filingId: string;
  assessmentYear: string;
  form: string;
  status: string;
  caStatus: CaFilingStatus;
  pan: string;
  taxpayerName: string;
  updatedAt: string;
  openMismatchCount: number;
  blockingMismatchCount: number;
};

export type CaCaseDetail = {
  filing: FilingRow;
  taxpayer: { pan: string; name: string; residentialStatus: string };
  recentEvents: FilingEventRow[];
  mismatches: {
    total: number;
    open: number;
    blocking: number;
    items: MismatchRow[];
  };
};

export type CaCaseUpdateStatus = Extract<
  CaFilingStatus,
  'requested' | 'ca_changes_needed' | 'approved'
>;

const RECENT_EVENT_LIMIT = 20;

export async function listCaCases(input?: {
  userId?: string;
}): Promise<{ ok: true; cases: CaCaseSummary[] } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();

    let taxpayerIds: string[] | null = null;
    if (input?.userId) {
      const { data: tRows } = await db.from('taxpayer').select('id, pan, name').eq('userId', input.userId);
      if (!tRows || tRows.length === 0) return { ok: true, cases: [] };
      taxpayerIds = tRows.map((t) => t.id);
    }

    let query = db
      .from('filing')
      .select('id, assessmentYear, form, status, caStatus, updatedAt, taxpayerId')
      .neq('caStatus', 'none')
      .order('updatedAt', { ascending: false });

    if (taxpayerIds) query = query.in('taxpayerId', taxpayerIds);

    const { data: filings, error } = await query;
    if (error) throw error;
    if (!filings || filings.length === 0) return { ok: true, cases: [] };

    const tIds = [...new Set(filings.map((f) => f.taxpayerId))];
    const { data: taxpayers } = await db.from('taxpayer').select('id, pan, name').in('id', tIds);
    const taxpayerById = Object.fromEntries((taxpayers ?? []).map((t) => [t.id, t]));

    const filingIds = filings.map((f) => f.id);
    const { data: mismatches } = await db
      .from('mismatch')
      .select('filingId, severity, decision')
      .in('filingId', filingIds);

    const mismatchStats = new Map<string, { open: number; blocking: number }>();
    for (const m of mismatches ?? []) {
      const stats = mismatchStats.get(m.filingId) ?? { open: 0, blocking: 0 };
      if (m.decision === 'open') {
        stats.open += 1;
        if (m.severity === 'blocking') stats.blocking += 1;
      }
      mismatchStats.set(m.filingId, stats);
    }

    const cases: CaCaseSummary[] = filings.map((f) => {
      const tp = taxpayerById[f.taxpayerId];
      const stats = mismatchStats.get(f.id) ?? { open: 0, blocking: 0 };
      return {
        filingId: f.id,
        assessmentYear: f.assessmentYear,
        form: f.form,
        status: f.status,
        caStatus: f.caStatus as CaFilingStatus,
        pan: tp?.pan ?? '',
        taxpayerName: tp?.name ?? '',
        updatedAt: f.updatedAt,
        openMismatchCount: stats.open,
        blockingMismatchCount: stats.blocking,
      };
    });

    return { ok: true, cases };
  } catch {
    return { ok: false, message: 'Could not load CA cases.' };
  }
}

export async function getCaCase(
  filingId: string,
): Promise<{ ok: true; case: CaCaseDetail } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();

    const { data: filingRows, error: fErr } = await db
      .from('filing')
      .select('*')
      .eq('id', filingId)
      .limit(1);

    if (fErr) throw fErr;
    const filing = filingRows?.[0] as FilingRow | undefined;
    if (!filing) return { ok: false, message: 'Filing not found.' };
    if (filing.caStatus === 'none') return { ok: false, message: 'Not a CA case.' };

    const { data: tRows } = await db
      .from('taxpayer')
      .select('pan, name, residentialStatus')
      .eq('id', filing.taxpayerId)
      .limit(1);

    const taxpayer = tRows?.[0];
    if (!taxpayer) return { ok: false, message: 'Taxpayer not found.' };

    const { data: events } = await db
      .from('filing_event')
      .select('*')
      .eq('filingId', filingId)
      .order('createdAt', { ascending: false })
      .limit(RECENT_EVENT_LIMIT);

    const { data: mismatchRows } = await db
      .from('mismatch')
      .select('*')
      .eq('filingId', filingId)
      .order('createdAt', { ascending: false });

    const items = (mismatchRows ?? []) as MismatchRow[];
    const open = items.filter((m) => m.decision === 'open').length;
    const blocking = items.filter((m) => m.decision === 'open' && m.severity === 'blocking').length;

    return {
      ok: true,
      case: {
        filing,
        taxpayer: {
          pan: taxpayer.pan,
          name: taxpayer.name,
          residentialStatus: taxpayer.residentialStatus,
        },
        recentEvents: (events ?? []) as FilingEventRow[],
        mismatches: { total: items.length, open, blocking, items },
      },
    };
  } catch {
    return { ok: false, message: 'Could not load CA case.' };
  }
}

export async function updateCaCase(input: {
  filingId: string;
  status: CaCaseUpdateStatus;
  note?: string;
}): Promise<{ ok: true; caStatus: CaFilingStatus } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    const { data: rows, error: loadErr } = await db
      .from('filing')
      .select('id, caStatus')
      .eq('id', input.filingId)
      .limit(1);

    if (loadErr) throw loadErr;
    if (!rows?.[0]) return { ok: false, message: 'Filing not found.' };
    if (rows[0].caStatus === 'none') return { ok: false, message: 'Not a CA case.' };

    const { error: updErr } = await db
      .from('filing')
      .update({ caStatus: input.status, updatedAt: now })
      .eq('id', input.filingId);

    if (updErr) throw updErr;

    await db.from('filing_event').insert({
      filingId: input.filingId,
      event: `ca_status_${input.status}`,
      actor: 'ca',
      detail: {
        previousStatus: rows[0].caStatus,
        status: input.status,
        note: input.note?.trim() || null,
      },
    });

    return { ok: true, caStatus: input.status };
  } catch {
    return { ok: false, message: 'Could not update CA case.' };
  }
}
