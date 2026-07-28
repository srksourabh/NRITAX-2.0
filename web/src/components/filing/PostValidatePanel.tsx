'use client';

import { useCallback, useEffect, useState } from 'react';

import type { FormReviewReport } from '@/lib/ai/review';
import type { PlanId } from '@/lib/billing/entitlements';
import type { ReturnData } from '@/lib/itr/types';

type EntitlementState = {
  plan: PlanId | null;
  active: boolean;
};

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
        checkout?: { mode: string; mockCompleteUrl?: string };
      };
      if (!json.ok || !json.checkout) {
        onNotice(json.message ?? 'Checkout failed.');
        return;
      }
      if (json.checkout.mode === 'mock' && json.checkout.mockCompleteUrl) {
        window.location.href = json.checkout.mockCompleteUrl;
        return;
      }
      onNotice('Razorpay order created. Complete payment in your Razorpay checkout integration.');
    } finally {
      setPayBusy(false);
    }
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
      onNotice(
        json.startsAt
          ? `CA call scheduled for ${new Date(json.startsAt).toLocaleString()}. Calendar invite downloaded.`
          : 'CA call scheduled.',
      );
      await loadSlots();
    } finally {
      setCaBusy(false);
    }
  }

  async function eriConsent() {
    setEriBusy(true);
    try {
      const res = await fetch('/api/eri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'consent', data }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        consent?: { consentId: string; status: string; message?: string };
      };
      if (!json.ok || !json.consent) {
        onNotice(json.message ?? 'Consent failed.');
        return;
      }
      setConsentId(json.consent.consentId);
      onNotice(json.consent.message ?? `Consent ${json.consent.status}.`);
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
      const res = await fetch('/api/eri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload', data, consentId }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        upload?: { acknowledgementNumber?: string; status: string; message?: string };
      };
      if (!json.ok || !json.upload) {
        onNotice(json.message ?? 'Upload failed.');
        return;
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
      const res = await fetch('/api/eri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', data, acknowledgementNumber: ack }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        status?: { status: string; message?: string };
      };
      if (!json.ok || !json.status) {
        onNotice(json.message ?? 'Status failed.');
        return;
      }
      onNotice(json.status.message ?? json.status.status);
    } finally {
      setEriBusy(false);
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
          AI review, paywall, optional CA booking, and ERI submit. Manual JSON download stays available
          above.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
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
          No paid plan yet. Mock checkout works without Razorpay keys.
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
        <h3 className="text-[var(--label)] font-semibold text-[var(--ink)]">Submit</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={eriBusy}
            onClick={() => void eriConsent()}
          >
            {eriBusy ? '…' : 'ERI consent'}
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={eriBusy || !consentId}
            onClick={() => void eriUpload()}
          >
            Submit via ERI
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={eriBusy || !ack}
            onClick={() => void eriStatus()}
          >
            ERI status
          </button>
          <a
            className="ntx-btn ntx-btn-secondary"
            href="https://incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            Manual portal upload
          </a>
        </div>
        <p className="text-[var(--caption)] text-[var(--text-muted)]">
          ERI uses the configured provider (default mock). Paid plan required for submit; JSON
          download above stays free. Never enter an Income Tax portal password here.
        </p>
        {consentId ? (
          <p className="text-[var(--caption)] text-[var(--text-muted)]">Consent: {consentId}</p>
        ) : null}
        {ack ? (
          <p className="text-[var(--caption)] text-[var(--text-muted)]">Ack: {ack}</p>
        ) : null}
      </div>
    </div>
  );
}
