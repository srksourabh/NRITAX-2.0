'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import type { FieldDef } from '@/lib/itr/types';

const SOURCE_LABEL: Record<string, string> = {
  eri: 'ITD prefill JSON (consent on portal)',
  ais: 'Annual Information Statement (AIS)',
  tis: 'Taxpayer Information Summary (TIS)',
  form26as: 'Form 26AS — TDS / TCS / advance tax credits',
  form16: 'Form 16 — employer salary certificate',
  cas: 'Consolidated Account Statement (CAMS / KFintech)',
  broker: 'Broker tax P&L or contract note',
  demat: 'Demat statement (NSDL / CDSL)',
  bank: 'Bank interest certificate or passbook',
  lender: "Lender's interest certificate",
  insurer: 'Insurance premium certificate',
  epfo: 'EPFO passbook / UAN statement',
  nps: 'NPS / PRAN statement',
  gst: 'GST returns',
  forms: 'Acknowledgement of the related ITR/statutory form',
  user: 'Your own records',
  computed: 'Calculated automatically by the form',
};

const TYPE_LABEL: Record<string, string> = {
  pan: 'Permanent Account Number (PAN)',
  tan: 'Tax Deduction Account Number (TAN)',
  aadhaar: 'Aadhaar number',
  mobile: '10-digit Indian mobile number',
  email: 'Email address',
  ifsc: 'Bank IFSC code (11 characters)',
  pin: '6-digit PIN code',
  num: 'Amount in whole Indian rupees',
  dec: 'Number (decimals allowed)',
  date: 'Date in yyyy-mm-dd format',
  text: 'Text',
  longtext: 'Text',
  sel: 'Selection from the list',
  gstin: 'GSTIN (15 characters)',
  isin: 'ISIN (12 characters)',
  bsr: 'BSR code (7 digits)',
};

const FORMAT_EXAMPLE: Partial<Record<string, string>> = {
  pan: 'ABCDE1234F',
  tan: 'ABCD12345E',
  aadhaar: '123456789012',
  mobile: '9876543210',
  ifsc: 'SBIN0001234',
  pin: '400001 (use 999999 for a foreign address)',
  date: '2025-07-31',
  gstin: '29ABCDE1234F1Z5',
  isin: 'INE009A01021',
  bsr: '0000001',
};

export function FieldHelp({
  label,
  text,
  field,
  fq,
  className,
}: {
  label: string;
  text: string;
  field?: FieldDef;
  fq?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const example = field ? FORMAT_EXAMPLE[field.type] : undefined;
  const sourceLabel = field?.source ? SOURCE_LABEL[field.source] : undefined;
  const typeLabel = field ? TYPE_LABEL[field.type] ?? field.type : undefined;

  return (
    <span ref={rootRef} className={cn('ntx-field-help', className)}>
      <button
        type="button"
        className="ntx-field-help-btn"
        aria-label={`Help: ${label}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>
      {open ? (
        <span id={panelId} role="note" className="ntx-field-help-panel ntx-field-help-panel-rich">
          {/* Field name */}
          <strong className="ntx-field-help-heading">{label}</strong>

          {/* What to enter */}
          {text ? (
            <span className="ntx-field-help-body">{text}</span>
          ) : null}

          {/* Format row */}
          {typeLabel ? (
            <span className="ntx-field-help-row">
              <span className="ntx-field-help-pill">Format</span>
              {typeLabel}
              {example ? <code className="ntx-field-help-code">{example}</code> : null}
            </span>
          ) : null}

          {/* Field key — where it maps in the JSON */}
          {fq ? (
            <span className="ntx-field-help-row">
              <span className="ntx-field-help-pill">JSON key</span>
              <code className="ntx-field-help-code">{fq}</code>
              {field?.path ? (
                <>
                  {' → '}
                  <code className="ntx-field-help-code">{field.path}</code>
                </>
              ) : null}
            </span>
          ) : null}

          {/* Source document */}
          {sourceLabel ? (
            <span className="ntx-field-help-row">
              <span className="ntx-field-help-pill">Source</span>
              {sourceLabel}
            </span>
          ) : null}

          {/* Mandatory flag */}
          {field?.required ? (
            <span className="ntx-field-help-row ntx-field-help-required">
              <span className="ntx-field-help-pill">Required</span>
              Mandatory — the return cannot be uploaded without this.
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
