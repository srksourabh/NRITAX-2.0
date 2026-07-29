/**
 * AIS / Form 26AS import parsing and persistence.
 */

import { getServiceClient } from '@/lib/db/client';
import type { TaxImportRow } from '@/lib/db/types';
import type { AisPayload } from '@/lib/eri/types';
import type { Form26AsData, Form26AsPartIEntry } from '@/lib/sandbox/ocr-types';

export type TaxImportRecord = {
  code?: string;
  description?: string;
  amount?: number;
  pan?: string;
  tan?: string;
  section?: string;
};

export type TaxImportKind = 'ais' | 'form26as';

export type ParseTaxImportResult =
  | { ok: true; records: TaxImportRecord[]; summary: Record<string, unknown> }
  | { ok: false; message: string };

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeRecord(partial: TaxImportRecord): TaxImportRecord {
  const out: TaxImportRecord = {};
  if (partial.code) out.code = String(partial.code).trim();
  if (partial.description) out.description = String(partial.description).trim();
  if (partial.amount !== undefined && Number.isFinite(partial.amount)) out.amount = partial.amount;
  if (partial.pan) out.pan = String(partial.pan).trim().toUpperCase();
  if (partial.tan) out.tan = String(partial.tan).trim().toUpperCase();
  if (partial.section) out.section = String(partial.section).trim();
  return out;
}

function parseAisPayload(raw: Record<string, unknown>): ParseTaxImportResult {
  const payload = raw as Partial<AisPayload>;
  const items = Array.isArray(payload.items) ? payload.items : [];

  const records: TaxImportRecord[] = items.map((item, index) =>
    normalizeRecord({
      code: item.category || `ais-${index + 1}`,
      description: item.description,
      amount: toNumber(item.amount),
      pan: item.counterpartyPan,
      section: item.quarter ? `Q${item.quarter}` : undefined,
    }),
  );

  const summary: Record<string, unknown> = {
    pan: payload.pan ?? null,
    assessmentYear: payload.assessmentYear ?? null,
    fetchedAt: payload.fetchedAt ?? null,
    recordCount: records.length,
    totals: payload.totals ?? {},
  };

  return { ok: true, records, summary };
}

function sectionFromDeductionWise(row: Array<string | number | null>): string | undefined {
  const cell = row[1];
  if (cell === null || cell === undefined) return undefined;
  const s = String(cell).trim();
  return s || undefined;
}

function recordsFromForm26Part(part: Form26AsPartIEntry[] | undefined, pan?: string): TaxImportRecord[] {
  const records: TaxImportRecord[] = [];
  for (const entry of part ?? []) {
    const tan = entry.tan_of_deductor?.trim().toUpperCase();
    const tds = toNumber(entry.total_tds_deposited ?? entry.total_tax_deducted);
    if (tan || tds !== undefined) {
      records.push(
        normalizeRecord({
          code: tan ? `tds-${tan}` : 'tds',
          description: entry.name_of_deductor,
          amount: tds,
          pan,
          tan,
          section: 'Part I',
        }),
      );
    }

    for (const row of entry.deduction_wise ?? []) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const section = sectionFromDeductionWise(row);
      const amount = toNumber(row[row.length - 1]);
      if (amount === undefined && !section) continue;
      records.push(
        normalizeRecord({
          code: section ? `deduction-${section}` : 'deduction',
          description: entry.name_of_deductor,
          amount,
          pan,
          tan,
          section,
        }),
      );
    }
  }
  return records;
}

function parseForm26AsPayload(raw: Record<string, unknown>): ParseTaxImportResult {
  const payload = raw as Form26AsData;
  const pan = payload.pan?.trim().toUpperCase();
  const records = recordsFromForm26Part(payload['Part I'], pan);

  for (const partKey of ['Part II', 'Part III', 'Part IV', 'Part V', 'Part VI'] as const) {
    const part = payload[partKey];
    if (!Array.isArray(part)) continue;
    for (let i = 0; i < part.length; i += 1) {
      const row = part[i];
      if (!row || typeof row !== 'object') continue;
      const obj = row as Record<string, unknown>;
      const amount =
        toNumber(obj.amount ?? obj.total ?? obj.total_tax_deducted ?? obj.total_tds_deposited) ??
        undefined;
      records.push(
        normalizeRecord({
          code: `${partKey}-${i + 1}`,
          description: String(obj.name ?? obj.description ?? obj.name_of_deductor ?? partKey),
          amount,
          pan,
          tan: obj.tan ? String(obj.tan).toUpperCase() : undefined,
          section: partKey,
        }),
      );
    }
  }

  const summary: Record<string, unknown> = {
    pan: pan ?? null,
    assessmentYear: payload.assessment_year ?? payload.financial_year ?? null,
    recordCount: records.length,
    totalTds: records
      .filter((r) => r.section === 'Part I' || r.code?.startsWith('tds'))
      .reduce((sum, r) => sum + (r.amount ?? 0), 0),
  };

  return { ok: true, records, summary };
}

/** Parse raw AIS or Form 26AS JSON into normalized import records. */
export function parseAisOr26asJson(raw: unknown, kind: TaxImportKind): ParseTaxImportResult {
  if (raw === null || raw === undefined) {
    return { ok: false, message: 'Import payload is empty.' };
  }

  let payload: unknown = raw;
  if (typeof raw === 'string') {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      return { ok: false, message: 'Import payload is not valid JSON.' };
    }
  }

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, message: 'Import payload must be a JSON object.' };
  }

  const obj = payload as Record<string, unknown>;
  if (kind === 'ais') {
    if ('data' in obj && typeof obj.data === 'object' && obj.data !== null) {
      return parseAisPayload(obj.data as Record<string, unknown>);
    }
    return parseAisPayload(obj);
  }

  if ('data' in obj && typeof obj.data === 'object' && obj.data !== null) {
    return parseForm26AsPayload(obj.data as Record<string, unknown>);
  }
  return parseForm26AsPayload(obj);
}

export async function saveTaxImport(input: {
  filingId: string;
  kind: TaxImportKind;
  sourceName?: string;
  records: TaxImportRecord[];
  summary?: Record<string, unknown>;
}): Promise<{ ok: true; importId: string } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const { data: rows, error } = await db
      .from('tax_import')
      .insert({
        filingId: input.filingId,
        kind: input.kind,
        sourceName: input.sourceName?.trim() || null,
        summary: input.summary ?? { recordCount: input.records.length },
        records: input.records,
      })
      .select('id')
      .limit(1);

    if (error || !rows?.[0]) throw error ?? new Error('Insert failed.');
    return { ok: true, importId: rows[0].id };
  } catch {
    return { ok: false, message: 'Could not save tax import.' };
  }
}

export async function listTaxImports(
  filingId: string,
): Promise<{ ok: true; imports: TaxImportRow[] } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('tax_import')
      .select('*')
      .eq('filingId', filingId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { ok: true, imports: (data ?? []) as TaxImportRow[] };
  } catch {
    return { ok: false, message: 'Could not list tax imports.' };
  }
}
