/**
 * The AI audit pass.
 *
 * The CBDT rule engine catches what the published rules can express. This asks
 * Claude for what they cannot: figures that reconcile on paper but not in life,
 * a regime that costs the taxpayer money, a deduction with no income behind it.
 * It is advisory — a verdict here never blocks an upload on its own.
 *
 * PAN, Aadhaar and bank account numbers are replaced with placeholders before
 * the return leaves this process, and mapped back when the report is rendered.
 * With no ANTHROPIC_API_KEY the audit reports itself unavailable rather than
 * throwing, so the filing flow still runs offline.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import type {
  FieldValue,
  RegimeComparison,
  ReturnData,
  TableRow,
  TaxComputation,
  ValidationReport,
} from '@/lib/itr/types';

const DEFAULT_MODEL = 'claude-opus-5';

/* ─────────────────────────── Report shape ─────────────────────────── */

export type AuditVerdict = 'clean' | 'review' | 'blocked';
export type AuditSeverity = 'high' | 'medium' | 'low';

export interface AuditObservation {
  severity: AuditSeverity;
  /** Schedule id, e.g. `CG`. */
  schedule: string;
  /** Fully qualified field key, e.g. `CG.ltcg112A`, when the model can name one. */
  field?: string;
  message: string;
  suggestion?: string;
}

export interface AuditReport {
  /** False when no API key is configured; the rest of the report is then empty. */
  available: boolean;
  verdict: AuditVerdict;
  observations: AuditObservation[];
  summary: string;
}

export interface AuditInput {
  data: ReturnData;
  tax: TaxComputation;
  /** The rule engine's findings, so the model does not repeat them. */
  validation: ValidationReport;
  /** Old versus new, when it has been computed. Shows the cost of the choice. */
  comparison?: RegimeComparison;
}

/* ─────────────────────────── Redaction ─────────────────────────── */

const PATTERNS: ReadonlyArray<{ label: string; rx: RegExp }> = [
  { label: 'PAN', rx: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },
  { label: 'AADHAAR', rx: /\b[2-9][0-9]{3}[ -]?[0-9]{4}[ -]?[0-9]{4}\b/g },
  // Indian bank account numbers run 9 to 18 digits. A rupee figure that long
  // is redacted too; over-redaction is the safe direction here, and the map
  // puts the digits back before anything is shown.
  { label: 'ACCOUNT', rx: /\b[0-9]{9,18}\b/g },
];

const PLACEHOLDER_RX = new RegExp(`\\[(?:${PATTERNS.map((p) => p.label).join('|')})_\\d+\\]`, 'g');

export interface Redaction {
  /** The text with every identifier replaced by a placeholder. */
  text: string;
  /** Placeholder to original value, e.g. `{ '[PAN_1]': 'ABCDE1234F' }`. */
  map: Record<string, string>;
}

/**
 * Replaces PAN, Aadhaar and bank account numbers with stable placeholders. The
 * same value always gets the same placeholder, so the model can still tell that
 * two figures refer to one account.
 */
export function redact(text: string): Redaction {
  const map: Record<string, string> = {};
  const tokens = new Map<string, string>();
  let out = text;

  for (const { label, rx } of PATTERNS) {
    let n = 0;
    out = out.replace(rx, (match) => {
      const seen = tokens.get(match);
      if (seen) return seen;
      n += 1;
      const token = `[${label}_${n}]`;
      tokens.set(match, token);
      map[token] = match;
      return token;
    });
  }

  return { text: out, map };
}

/** Puts the redacted values back. The inverse of `redact` for the same map. */
export function restore(text: string, map: Record<string, string>): string {
  return text.replace(PLACEHOLDER_RX, (token) => map[token] ?? token);
}

/* ─────────────────────────── Prompt ─────────────────────────── */

const SYSTEM_PROMPT = `You review Indian income tax returns for assessment year 2026-27 before they are
uploaded to the Income Tax portal. The taxpayer is usually a non-resident.

The CBDT validation rules have already run and their findings are in the
payload. Do not repeat them. Look for what those rules cannot express:

- figures that are internally consistent but implausible for this taxpayer;
- a regime choice that costs the taxpayer money;
- a deduction claimed without the income that would support it;
- a residential status that contradicts the reported days of stay;
- schedules a non-resident normally files that are absent here.

Cite the schedule for every observation, and the fully qualified field key
("SCHEDULE.field", e.g. "CG.ltcg112A") whenever you can name one. All money is
in whole rupees. Placeholders such as [PAN_1] stand for redacted identifiers:
treat them as opaque and never guess what they hide.

Return an empty observation list when you find nothing. Do not pad the report
with restatements of the return, generic tax advice, or observations you do not
believe. Keep each message to a sentence or two.

Set verdict to "clean" when nothing needs the taxpayer's attention, "review"
when something should be checked before filing, and "blocked" when filing as it
stands would be wrong.`;

const AUDIT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'observations', 'summary'],
  properties: {
    verdict: { type: 'string', enum: ['clean', 'review', 'blocked'] },
    observations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'schedule', 'message'],
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          schedule: { type: 'string' },
          field: { type: 'string' },
          message: { type: 'string' },
          suggestion: { type: 'string' },
        },
      },
    },
    summary: { type: 'string' },
  },
};

const modelReport = z.object({
  verdict: z.enum(['clean', 'review', 'blocked']),
  observations: z.array(
    z.object({
      severity: z.enum(['high', 'medium', 'low']),
      schedule: z.string(),
      field: z.string().optional(),
      message: z.string(),
      suggestion: z.string().optional(),
    }),
  ),
  summary: z.string(),
});

/** A figure the taxpayer never supplied. Empty strings and zeros are not answers. */
function isBlank(value: FieldValue): boolean {
  return value === null || value === '' || value === 0;
}

/** Only the schedules the taxpayer actually filled, to keep the prompt honest and short. */
function compactSchedules(data: ReturnData): {
  fields: Record<string, FieldValue>;
  tables: Record<string, TableRow[]>;
} {
  const fields: Record<string, FieldValue> = {};
  for (const [key, value] of Object.entries(data.fields)) {
    if (!isBlank(value)) fields[key] = value;
  }

  const tables: Record<string, TableRow[]> = {};
  for (const [key, rows] of Object.entries(data.tables)) {
    const filled = rows.filter((row) => Object.values(row).some((value) => !isBlank(value)));
    if (filled.length > 0) tables[key] = filled;
  }

  return { fields, tables };
}

function buildPayload(input: AuditInput): Record<string, unknown> {
  const { meta } = input.data;
  return {
    form: meta.form,
    regime: meta.regime,
    residentialStatus: meta.residentialStatus,
    assesseeStatus: meta.status,
    filingSection: meta.filingSection,
    filingDate: meta.filingDate,
    dueDate: meta.dueDate,
    tax: input.tax,
    regimeComparison: input.comparison && {
      better: input.comparison.better,
      saving: input.comparison.saving,
      detail: input.comparison.detail,
    },
    ruleFindings: input.validation.findings.map((finding) => ({
      n: finding.n,
      category: finding.cat,
      schedule: finding.schedule,
      field: finding.field,
      message: finding.message,
    })),
    schedules: compactSchedules(input.data),
  };
}

/* ─────────────────────────── Audit ─────────────────────────── */

/**
 * Reviews a completed return with Claude and returns what it found. Reports
 * `available: false` and nothing else when ANTHROPIC_API_KEY is absent.
 */
export async function auditReturn(input: AuditInput): Promise<AuditReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return {
      available: false,
      verdict: 'clean',
      observations: [],
      summary: 'AI audit skipped — no API key configured.',
    };
  }

  const { text: prompt, map } = redact(JSON.stringify(buildPayload(input), null, 1));

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    max_tokens: 64_000,
    system: SYSTEM_PROMPT,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: AUDIT_SCHEMA },
    },
    messages: [{ role: 'user', content: prompt }],
  });

  const message = await stream.finalMessage();
  const text = message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('');
  const report = modelReport.parse(JSON.parse(text));

  return {
    available: true,
    verdict: report.verdict,
    observations: report.observations.map((observation) => ({
      ...observation,
      message: restore(observation.message, map),
      suggestion:
        observation.suggestion === undefined ? undefined : restore(observation.suggestion, map),
    })),
    summary: restore(report.summary, map),
  };
}
