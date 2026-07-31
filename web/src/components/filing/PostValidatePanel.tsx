'use client';

import { useCallback, useEffect, useState } from 'react';

import type { FormReviewReport } from '@/lib/ai/review';
import type { PlanId } from '@/lib/billing/entitlements';
import { ITD_PORTAL_HOME } from '@/lib/itd/portal';
import type { ReturnData } from '@/lib/itr/types';
import { MismatchCenter, type MismatchItem } from '@/components/filing/MismatchCenter';
import {
  dtaaEvidenceRequired,
  scheduleFaRequired,
  ftcForm67Needed,
} from '@/lib/itr/nri-workflows';
import { recommendEverifyMethods } from '@/lib/filing/everify';

type EntitlementState = {
  plan: PlanId | null;
  active: boolean;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>('script[data-nritax-razorpay]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Checkout.js failed to load.')), {
        once: true,
      });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.nritaxRazorpay = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Checkout.js failed to load.'));
    document.body.appendChild(script);
  });
}

export function PostValidatePanel({
  data,
  onNotice,
  downloadBlocked,
}: {
  data: ReturnData;
  onNotice: (message: string) => void;
  /** When true, parent should treat download as cautioned (block findings). */
  downloadBlocked?: (blocked: boolean) => void;
}) {
  const [review, setReview] = useState<FormReviewReport | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementState>({ plan: null, active: false });
  const [payBusy, setPayBusy] = useState(false);
  const [slots, setSlots] = useState<Array<{ id: string; startsAt: string; endsAt: string }>>([]);
  const [caBusy, setCaBusy] = useState(false);
  const [eriBusy, setEriBusy] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [ack, setAck] = useState<string | null>(null);
  const [ackInput, setAckInput] = useState('');
  const [transportBusy, setTransportBusy] = useState(false);
  const [filingId, setFilingId] = useState<string | null>(null);
  const [approveBusy, setApproveBusy] = useState(false);
  const [mismatches, setMismatches] = useState<MismatchItem[]>([]);
  const [eriReady, setEriReady] = useState<{
    summary: string;
    mode: string;
    live: boolean;
    referUrl?: string;
    nextSteps: string[];
  } | null>(null);

  const nriHints = [
    dtaaEvidenceRequired(data.meta.residentialStatus)
      ? 'DTAA / TRC evidence may be required for treaty relief.'
      : null,
    scheduleFaRequired(data.meta.residentialStatus)
      ? 'Schedule FA may be required for foreign assets.'
      : null,
    ftcForm67Needed({ hasForeignTaxPaid: Boolean(data.fields['TR.taxReliefClaimed']) })
      ? 'Form 67 may be needed for foreign tax credit.'
      : null,
  ].filter(Boolean);

  const everify = recommendEverifyMethods(data.meta.residentialStatus);

  const refreshEntitlement = useCallback(async () => {
    try {
      const res = await fetch('/api/pay/checkout');
      const json = (await res.json()) as {
        ok?: boolean;
        entitlement?: EntitlementState;
      };
      if (json.ok && json.entitlement) setEntitlement(json.entitlement);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshEntitlement();
  }, [refreshEntitlement]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/eri');
        const json = (await res.json()) as {
          ok?: boolean;
          readiness?: {
            summary: string;
            mode: string;
            live: boolean;
            referUrl?: string;
            nextSteps: string[];
          };
        };
        if (json.ok && json.readiness) setEriReady(json.readiness);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    downloadBlocked?.(Boolean(review?.blocksFilingRecommendation));
  }, [review, downloadBlocked]);

  async function runReview() {
    setReviewBusy(true);
    try {
      const res = await fetch('/api/filing/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        review?: FormReviewReport;
      };
      if (!json.ok || !json.review) {
        onNotice(json.message ?? 'Review failed.');
        return;
      }
      setReview(json.review);
      onNotice(json.review.summary);
    } finally {
      setReviewBusy(false);
    }
  }

  async function startCheckout(plan: PlanId) {
    setPayBusy(true);
    try {
      const res = await fetch('/api/pay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        checkout?: {
          mode: string;
          mockCompleteUrl?: string;
          orderId?: string;
          amountPaise?: number;
          currency?: string;
          keyId?: string;
        };
      };
      if (!json.ok || !json.checkout) {
        onNotice(json.message ?? 'Checkout failed.');
        return;
      }
      if (json.checkout.mode === 'mock' && json.checkout.mockCompleteUrl) {
        window.location.href = json.checkout.mockCompleteUrl;
        return;
      }
      if (
        json.checkout.mode === 'razorpay' &&
        json.checkout.orderId &&
        json.checkout.keyId &&
        typeof json.checkout.amountPaise === 'number'
      ) {
        await openRazorpayCheckout({
          keyId: json.checkout.keyId,
          orderId: json.checkout.orderId,
          amountPaise: json.checkout.amountPaise,
          currency: json.checkout.currency ?? 'INR',
        });
        return;
      }
      onNotice('Checkout could not start. Try again, or use mock checkout without Razorpay keys.');
    } finally {
      setPayBusy(false);
    }
  }

  async function openRazorpayCheckout(input: {
    keyId: string;
    orderId: string;
    amountPaise: number;
    currency: string;
  }) {
    await loadRazorpayScript();
    const RazorpayCtor = window.Razorpay;
    if (!RazorpayCtor) {
      onNotice('Razorpay Checkout.js failed to load. Check your network and try again.');
      return;
    }

    await new Promise<void>((resolve) => {
      const rzp = new RazorpayCtor({
        key: input.keyId,
        amount: input.amountPaise,
        currency: input.currency,
        order_id: input.orderId,
        name: 'NRITAX',
        description: 'Filing plan',
        handler: (response) => {
          void (async () => {
            try {
              const verifyRes = await fetch('/api/pay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              const verifyJson = (await verifyRes.json()) as {
                ok?: boolean;
                message?: string;
                plan?: PlanId;
              };
              if (!verifyJson.ok) {
                onNotice(verifyJson.message ?? 'Payment verify failed.');
                return;
              }
              onNotice(
                verifyJson.plan === 'ca_assisted'
                  ? 'Payment received. CA-assisted plan is active.'
                  : 'Payment received. Self-serve plan is active.',
              );
              await refreshEntitlement();
            } finally {
              resolve();
            }
          })();
        },
        modal: {
          ondismiss: () => resolve(),
        },
      });
      rzp.open();
    });
  }

  async function loadSlots() {
    setCaBusy(true);
    try {
      const res = await fetch('/api/ca/book');
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        slots?: Array<{ id: string; startsAt: string; endsAt: string }>;
      };
      if (!json.ok) {
        onNotice(json.message ?? 'Could not load CA slots.');
        return;
      }
      setSlots(json.slots ?? []);
    } finally {
      setCaBusy(false);
    }
  }

  async function book(slotId: string) {
    setCaBusy(true);
    try {
      const res = await fetch('/api/ca/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          caBrief: review?.summary,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        ics?: string;
        startsAt?: string;
        emailSent?: boolean;
      };
      if (!json.ok) {
        onNotice(json.message ?? 'Booking failed.');
        return;
      }
      if (json.ics) {
        const blob = new Blob([json.ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nritax-ca-call.ics';
        a.click();
        URL.revokeObjectURL(url);
      }
      const when = json.startsAt
        ? `CA call scheduled for ${new Date(json.startsAt).toLocaleString()}.`
        : 'CA call scheduled.';
      const mail = json.emailSent
        ? ' Calendar invite emailed and downloaded.'
        : ' Calendar invite downloaded (email invite needs AUTH_EMAIL_SERVER).';
      onNotice(`${when}${mail}`);
      await loadSlots();
    } finally {
      setCaBusy(false);
    }
  }

  async function eriConsent() {
    setEriBusy(true);
    try {
      const id = await ensureFilingId();
      const res = await fetch('/api/eri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'consent', data, filingId: id ?? undefined }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        warnings?: string[];
        consent?: {
          consentId: string;
          status: string;
          message?: string;
          redirectUrl?: string;
        };
      };
      if (!json.ok || !json.consent) {
        onNotice(json.message ?? 'Consent failed.');
        return;
      }
      setConsentId(json.consent.consentId);
      if (json.consent.redirectUrl && typeof window !== 'undefined') {
        window.open(json.consent.redirectUrl, '_blank', 'noopener,noreferrer');
      }
      const warn = json.warnings?.[0] ? ` · ${json.warnings[0]}` : '';
      onNotice(`${json.consent.message ?? `Consent ${json.consent.status}.`}${warn}`);
    } finally {
      setEriBusy(false);
    }
  }

  async function eriUpload() {
    if (!consentId) {
      onNotice('Request ERI consent first.');
      return;
    }
    if (review?.blocksFilingRecommendation) {
      onNotice('AI review has a block finding. Fix it or get CA approval before ERI submit.');
      return;
    }
    setEriBusy(true);
    try {
      const id = await ensureFilingId();
      const res = await fetch('/api/eri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          data,
          consentId,
          filingId: id ?? undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        upload?: {
          acknowledgementNumber?: string;
          status: string;
          message?: string;
          verificationRedirectUrl?: string;
        };
      };
      if (!json.ok || !json.upload) {
        onNotice(json.message ?? 'Upload failed.');
        return;
      }
      if (json.upload.verificationRedirectUrl && typeof window !== 'undefined') {
        window.open(json.upload.verificationRedirectUrl, '_blank', 'noopener,noreferrer');
      }
      if (json.upload.acknowledgementNumber) setAck(json.upload.acknowledgementNumber);
      onNotice(
        json.upload.acknowledgementNumber
          ? `ERI ${json.upload.status}: ${json.upload.acknowledgementNumber}`
          : json.upload.message ?? json.upload.status,
      );
    } finally {
      setEriBusy(false);
    }
  }

  async function eriStatus() {
    if (!ack) {
      onNotice('No acknowledgement number yet.');
      return;
    }
    setEriBusy(true);
    try {
      const id = filingId;
      const res = await fetch('/api/eri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          data,
          acknowledgementNumber: ack,
          filingId: id ?? undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        eriConsentId?: string;
        status?: { status: string; message?: string };
      };
      if (!json.ok || !json.status) {
        onNotice(json.message ?? 'Status failed.');
        return;
      }
      if (json.eriConsentId && !consentId) setConsentId(json.eriConsentId);
      onNotice(json.status.message ?? json.status.status);
    } finally {
      setEriBusy(false);
    }
  }

  async function ensureFilingId(): Promise<string | null> {
    if (filingId) return filingId;
    const saveRes = await fetch('/api/filing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const saveJson = (await saveRes.json()) as { ok?: boolean; filingId?: string; message?: string };
    if (!saveJson.ok || !saveJson.filingId) {
      onNotice(saveJson.message ?? 'Save a draft with PAN first.');
      return null;
    }
    setFilingId(saveJson.filingId);
    return saveJson.filingId;
  }

  async function approveSnapshot() {
    setApproveBusy(true);
    try {
      const id = await ensureFilingId();
      if (!id) return;
      const res = await fetch('/api/filing/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filingId: id, data }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; digest?: string };
      onNotice(json.message ?? (json.ok ? 'Filing approved.' : 'Approval failed.'));
    } finally {
      setApproveBusy(false);
    }
  }

  async function refreshMismatches() {
    const id = await ensureFilingId();
    if (!id) return;
    const res = await fetch(`/api/filing/mismatches?filingId=${encodeURIComponent(id)}`);
    const json = (await res.json()) as { ok?: boolean; mismatches?: MismatchItem[]; message?: string };
    if (!json.ok) {
      onNotice(json.message ?? 'Could not load mismatches.');
      return;
    }
    setMismatches(json.mismatches ?? []);
  }

  async function recordManualAck() {
    setTransportBusy(true);
    try {
      const id = await ensureFilingId();
      if (!id) return;

      const res = await fetch('/api/filing/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filingId: id,
          data,
          mode: 'manual',
          acknowledgementNumber: ackInput.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        acknowledgementNumber?: string;
        digest?: string;
      };
      if (!json.ok) {
        onNotice(json.message ?? 'Could not record transport.');
        return;
      }
      if (json.acknowledgementNumber) setAck(json.acknowledgementNumber);
      onNotice(
        json.message ??
          (json.digest ? `Transport recorded · digest ${json.digest.slice(0, 12)}…` : 'Transport recorded.'),
      );
    } finally {
      setTransportBusy(false);
    }
  }

  const actionClass = (action: string) => {
    if (action === 'block') return 'ntx-badge ntx-badge-notice';
    if (action === 'flag') return 'ntx-badge ntx-badge-due';
    if (action === 'warn') return 'ntx-badge ntx-badge-due';
    return 'ntx-badge ntx-badge-draft';
  };

  return (
    <div className="ntx-panel mt-6 space-y-6 p-6">
      <div>
        <h2 className="text-[var(--h3)] font-semibold text-[var(--ink)]">After validate</h2>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--text-muted)]">
          AI review, paywall, optional CA booking, approval gate, mismatch center, and ERI / manual
          transport. Manual JSON download stays available above.
        </p>
        {nriHints.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--body-sm)] text-[var(--text-secondary)]">
            {nriHints.map((h) => (
              <li key={String(h)}>{h}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-2 text-[var(--caption)] text-[var(--text-muted)]">
          Recommended e-verify: {everify.map((m) => m.label).join(' · ') || 'ITR-V by post'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ntx-btn ntx-btn-credit"
          disabled={approveBusy}
          onClick={() => void approveSnapshot()}
        >
          {approveBusy ? '…' : 'Approve filing snapshot'}
        </button>
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary"
          onClick={() => void refreshMismatches()}
        >
          Refresh mismatches
        </button>
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary"
          disabled={reviewBusy}
          onClick={() => void runReview()}
        >
          {reviewBusy ? 'Reviewing…' : 'Review with AI'}
        </button>
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary"
          disabled={payBusy}
          onClick={() => void startCheckout('self_serve')}
        >
          {payBusy ? '…' : 'Pay · self-serve'}
        </button>
        <button
          type="button"
          className="ntx-btn ntx-btn-secondary"
          disabled={payBusy}
          onClick={() => void startCheckout('ca_assisted')}
        >
          {payBusy ? '…' : 'Pay · CA-assisted'}
        </button>
      </div>

      {entitlement.active ? (
        <p className="text-[var(--body-sm)] text-[var(--credit-text)]">
          Plan active: {entitlement.plan === 'ca_assisted' ? 'CA-assisted' : 'Self-serve'}
        </p>
      ) : (
        <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
          No paid plan yet. Without Razorpay keys, checkout uses the mock grant path. With keys,
          Checkout.js opens in this browser.
        </p>
      )}

      {review ? (
        <div className="space-y-3 border-t border-[var(--rule)] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={actionClass(review.highestAction)}>{review.highestAction}</span>
            {review.wrongFormSuspected ? (
              <span className="ntx-badge ntx-badge-notice">wrong form suspected</span>
            ) : null}
            <span className="text-[var(--caption)] text-[var(--text-muted)]">
              source · {review.source}
            </span>
          </div>
          <p className="text-[var(--body-sm)] text-[var(--ink)]">{review.summary}</p>
          <ul className="space-y-2">
            {review.findings.map((f) => (
              <li key={f.id} className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={actionClass(f.action)}>{f.action}</span>
                  <span className="text-[var(--caption)] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-figure)' }}>
                    {f.code}
                  </span>
                  <span className="font-medium text-[var(--ink)]">{f.title}</span>
                </div>
                <p className="mt-1 text-[var(--body-sm)] text-[var(--neutral-700)]">{f.userMessage}</p>
                {f.suggestedFix ? (
                  <p className="mt-1 text-[var(--caption)] text-[var(--text-muted)]">{f.suggestedFix}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {filingId && mismatches.length > 0 ? (
        <div className="space-y-3 border-t border-[var(--rule)] pt-4">
          <h3 className="text-[var(--label)] font-semibold text-[var(--ink)]">Mismatch center</h3>
          <MismatchCenter
            filingId={filingId}
            mismatches={mismatches}
            onNotice={onNotice}
          />
        </div>
      ) : null}

      {entitlement.plan === 'ca_assisted' ? (
        <div className="space-y-3 border-t border-[var(--rule)] pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary"
              disabled={caBusy}
              onClick={() => void loadSlots()}
            >
              {caBusy ? '…' : 'Load CA slots'}
            </button>
          </div>
          {slots.length > 0 ? (
            <ul className="space-y-2">
              {slots.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 border border-[var(--neutral-200)] p-3"
                >
                  <span className="text-[var(--body-sm)]">
                    {new Date(s.startsAt).toLocaleString()} →{' '}
                    {new Date(s.endsAt).toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    className="ntx-btn ntx-btn-primary"
                    disabled={caBusy}
                    onClick={() => void book(s.id)}
                  >
                    Book + ICS
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3 border-t border-[var(--rule)] pt-4">
        <h3 className="text-[var(--label)] font-semibold text-[var(--ink)]">
          Finish on the Income Tax portal
        </h3>
        <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
          NRITAX prepares the return. Download JSON above, then upload it yourself on the
          department site. Live ERI submit is deferred — we do not hand users to Quicko or
          another filing platform.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            className="ntx-btn ntx-btn-primary"
            href={ITD_PORTAL_HOME}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open e-Filing portal
          </a>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block min-w-[14rem] flex-1">
            <span className="text-[var(--caption)] text-[var(--text-muted)]">
              Portal acknowledgement number
            </span>
            <input
              className="ntx-input mt-1 w-full"
              value={ackInput}
              onChange={(e) => setAckInput(e.target.value)}
              placeholder="Optional · after you upload"
            />
          </label>
          <button
            type="button"
            className="ntx-btn ntx-btn-credit"
            disabled={transportBusy}
            onClick={() => void recordManualAck()}
          >
            {transportBusy ? '…' : 'Record manual transport'}
          </button>
        </div>
        <p className="text-[var(--caption)] text-[var(--text-muted)]">
          Prefill can come from browser automation (Fetch prefill) or a JSON file you download
          yourself. After mapping and validate, Download JSON is the filing artifact.
        </p>
        <details className="text-[var(--caption)] text-[var(--text-muted)]">
          <summary className="cursor-pointer select-none font-semibold text-[var(--primary)]">
            Deferred · ERI submit (not used in production yet)
          </summary>
          <p className="mt-2">
            {eriReady?.summary ??
              'ERI stays on mock until ITD intermediary credentials exist. No third-party filing platform.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary ntx-btn-compact"
              disabled={eriBusy}
              onClick={() => void eriConsent()}
            >
              {eriBusy ? '…' : 'ERI consent (mock)'}
            </button>
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary ntx-btn-compact"
              disabled={eriBusy || !consentId}
              onClick={() => void eriUpload()}
            >
              Submit via ERI (mock)
            </button>
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary ntx-btn-compact"
              disabled={eriBusy || !ack}
              onClick={() => void eriStatus()}
            >
              ERI status
            </button>
          </div>
          {consentId ? (
            <p className="mt-2">Consent: {consentId}</p>
          ) : null}
          {ack ? <p className="mt-1">Ack: {ack}</p> : null}
        </details>
      </div>
    </div>
  );
}
