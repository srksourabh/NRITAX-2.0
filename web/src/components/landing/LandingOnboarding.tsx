'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ITD_PORTAL_HOME, ITD_PORTAL_LABEL, ITD_PORTAL_LOGIN } from '@/lib/itd/portal';
import type { FormType } from '@/lib/itr/types';
import {
  isValidPan,
  normalizePan,
  writeFilingSession,
  type FilingAccessMode,
} from '@/lib/session/filing-session';

type Draft = {
  fullName: string;
  dob: string;
  pan: string;
  password: string;
  mobile: string;
  accessMode: FilingAccessMode | '';
  form: FormType | '';
  consentAutomation: boolean;
};

type Errors = Partial<Record<keyof Draft | 'base', string>>;

const STEPS = ['Identity', 'Portal access', 'ITR form'] as const;

const empty: Draft = {
  fullName: '',
  dob: '',
  pan: '',
  password: '',
  mobile: '',
  accessMode: '',
  form: '',
  consentAutomation: false,
};

function validateStep(step: number, data: Draft): Errors {
  const errors: Errors = {};
  if (step === 0) {
    if (data.fullName.trim().length < 2) errors.fullName = 'Enter your full name as on PAN.';
    if (!data.dob) errors.dob = 'Enter your date of birth.';
    if (!data.pan.trim()) errors.pan = 'Enter your PAN.';
    else if (!isValidPan(data.pan)) {
      errors.pan = 'PAN must be 10 characters, for example ABCDE1234F.';
    }
  }
  if (step === 1) {
    if (!data.accessMode) {
      errors.accessMode = 'Choose whether you already have an e-Filing password.';
    } else if (data.accessMode === 'has_password') {
      if (!data.password) errors.password = 'Enter your Income Tax e-Filing password.';
      if (data.mobile && !/^\d{10}$/.test(data.mobile.replace(/\D/g, ''))) {
        errors.mobile =
          'If provided, use a 10-digit Indian mobile registered on the portal. Leave blank for overseas numbers.';
      }
      if (!data.consentAutomation) {
        errors.consentAutomation =
          'Confirm we may use browser automation with this password for this session only.';
      }
    }
  }
  if (step === 2 && !data.form) errors.form = 'Select ITR-2 or ITR-3.';
  return errors;
}

export function LandingOnboarding({
  primaryHref,
  continueLabel = 'Continue to filing',
}: {
  primaryHref: string;
  continueLabel?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Errors>({});

  const update = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'pan' && typeof value === 'string') {
        /* user ID is always PAN */
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const goToStep = (index: number) => {
    if (index < 0 || index > step) return;
    setErrors({});
    setStep(index);
  };

  const goNext = () => {
    const nextErrors = validateStep(step, data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === 1 && data.accessMode === 'create_account') {
      document.getElementById('create-account')?.scrollIntoView({ behavior: 'smooth' });
      setStep(2);
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    const pan = normalizePan(data.pan);
    try {
      writeFilingSession({
        fullName: data.fullName.trim(),
        dob: data.dob,
        pan,
        userId: pan,
        password: data.accessMode === 'has_password' ? data.password : undefined,
        mobile: data.mobile.replace(/\D/g, '') || undefined,
        accessMode: data.accessMode as FilingAccessMode,
        form: data.form as FormType,
        consentAutomation: data.accessMode === 'has_password' ? data.consentAutomation : false,
        savedAt: new Date().toISOString(),
      });
    } catch {
      setErrors({ base: 'Could not save this session in the browser. Check private-mode settings.' });
      return;
    }

    const href =
      data.accessMode === 'create_account'
        ? `${primaryHref}${primaryHref.includes('?') ? '&' : '?'}guide=create-account`
        : `${primaryHref}${primaryHref.includes('?') ? '&' : '?'}autoPrefill=1`;
    router.push(href);
  };

  return (
    <section id="start" className="ntx-section ntx-landing-anchor" aria-labelledby="start-heading">
      <div className="ntx-shell ntx-landing-onboard">
        <div className="ntx-landing-rise">
          <p className="ntx-landing-kicker">Start filing</p>
          <h2 id="start-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
            Your Income Tax portal login drives the return
          </h2>
          <p className="ntx-landing-section-lede">
            We do not keep your Income Tax data. Your e-Filing user ID is your PAN. The password
            stays in this browser tab for this session only, so browser automation can fetch
            prefill and later push the JSON. You remain the account holder.
          </p>
          <div className="ntx-landing-security">
            <h3>Your data stays yours</h3>
            <p>
              NRITAX does not store your portal password on our servers. You need an Income Tax
              Department user ID first — creating one is straightforward, and we guide you if you
              do not have a password yet.
            </p>
          </div>
        </div>

        <div className="ntx-landing-form ntx-landing-rise" aria-labelledby="onboarding-form-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[var(--body-sm)] font-semibold text-[var(--primary)]">
                Session setup
              </p>
              <h3 id="onboarding-form-title" className="mt-1 text-[var(--h2)] font-semibold text-[var(--ink)]">
                Name, PAN, and portal access
              </h3>
            </div>
            <span className="ntx-badge ntx-badge-draft">
              Step {step + 1}/{STEPS.length}
            </span>
          </div>

          <ol className="ntx-landing-progress" aria-label="Onboarding progress">
            {STEPS.map((label, index) => {
              const done = index < step;
              const current = index === step;
              const canJumpBack = index < step;
              return (
                <li
                  key={label}
                  className={current ? 'is-current' : done ? 'is-done' : undefined}
                >
                  <button
                    type="button"
                    className="ntx-landing-progress-node"
                    disabled={!canJumpBack}
                    aria-current={current ? 'step' : undefined}
                    onClick={() => goToStep(index)}
                  >
                    <span aria-hidden="true">{index + 1}</span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="ntx-landing-form-body">
            {step === 0 ? (
              <>
                <div>
                  <label className="ntx-label" htmlFor="landing-name">
                    Full name (as on PAN)
                  </label>
                  <input
                    id="landing-name"
                    className="ntx-input"
                    autoComplete="name"
                    value={data.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                  />
                  {errors.fullName ? <p className="ntx-field-error">{errors.fullName}</p> : null}
                </div>
                <div>
                  <label className="ntx-label" htmlFor="landing-dob">
                    Date of birth
                  </label>
                  <input
                    id="landing-dob"
                    className="ntx-input"
                    type="date"
                    value={data.dob}
                    onChange={(e) => update('dob', e.target.value)}
                  />
                  {errors.dob ? <p className="ntx-field-error">{errors.dob}</p> : null}
                </div>
                <div>
                  <label className="ntx-label" htmlFor="landing-pan">
                    PAN / e-Filing user ID
                  </label>
                  <input
                    id="landing-pan"
                    className="ntx-input ntx-figure"
                    autoComplete="off"
                    spellCheck={false}
                    value={data.pan}
                    onChange={(e) => update('pan', normalizePan(e.target.value))}
                    placeholder="ABCDE1234F"
                  />
                  <p className="mt-1 text-[var(--caption)] text-[var(--text-muted)]">
                    On the {ITD_PORTAL_LABEL}, the user ID is always your PAN.
                  </p>
                  {errors.pan ? <p className="ntx-field-error">{errors.pan}</p> : null}
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <fieldset className="ntx-landing-radio-set">
                  <legend className="ntx-label">Income Tax e-Filing password</legend>
                  {(
                    [
                      {
                        value: 'has_password' as const,
                        label: 'I have my portal password',
                        detail: 'We will open the portal with browser automation and fetch prefill.',
                      },
                      {
                        value: 'create_account' as const,
                        label: 'I do not have a password — I need to create one',
                        detail: 'We guide you to register on the Income Tax Department site first.',
                      },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={
                        data.accessMode === option.value
                          ? 'ntx-landing-radio is-selected'
                          : 'ntx-landing-radio'
                      }
                    >
                      <input
                        type="radio"
                        name="landing-access"
                        value={option.value}
                        checked={data.accessMode === option.value}
                        onChange={() => update('accessMode', option.value)}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <span>{option.detail}</span>
                      </span>
                    </label>
                  ))}
                  {errors.accessMode ? (
                    <p className="ntx-field-error">{errors.accessMode}</p>
                  ) : null}
                </fieldset>

                {data.accessMode === 'has_password' ? (
                  <>
                    <div>
                      <label className="ntx-label" htmlFor="landing-password">
                        e-Filing password
                      </label>
                      <input
                        id="landing-password"
                        className="ntx-input"
                        type="password"
                        autoComplete="current-password"
                        value={data.password}
                        onChange={(e) => update('password', e.target.value)}
                      />
                      {errors.password ? (
                        <p className="ntx-field-error">{errors.password}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="ntx-label" htmlFor="landing-mobile">
                        Registered mobile (optional)
                      </label>
                      <input
                        id="landing-mobile"
                        className="ntx-input ntx-figure"
                        inputMode="numeric"
                        maxLength={10}
                        value={data.mobile}
                        onChange={(e) =>
                          update('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        placeholder="Optional Indian 10 digits"
                      />
                      <p className="mt-1 text-[var(--caption)] text-[var(--text-muted)]">
                        Leave blank for overseas numbers. OTP may come by email or Aadhaar-linked
                        mobile when the portal asks.
                      </p>
                      {errors.mobile ? <p className="ntx-field-error">{errors.mobile}</p> : null}
                    </div>
                    <label className="flex items-start gap-2 text-[var(--body-sm)] text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={data.consentAutomation}
                        onChange={(e) => update('consentAutomation', e.target.checked)}
                      />
                      <span>
                        I authorise NRITAX to use browser automation in this session to sign in
                        with my PAN and password, download prefill, and later upload the return
                        JSON. The password is not stored on NRITAX servers.
                      </span>
                    </label>
                    {errors.consentAutomation ? (
                      <p className="ntx-field-error">{errors.consentAutomation}</p>
                    ) : null}
                  </>
                ) : null}

                {data.accessMode === 'create_account' ? (
                  <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
                    Next you will pick an ITR form, then we show the create-account guide. Official
                    register link:{' '}
                    <a
                      className="underline underline-offset-2"
                      href={ITD_PORTAL_LOGIN}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ITD_PORTAL_HOME}
                    </a>
                    .
                  </p>
                ) : null}
              </>
            ) : null}

            {step === 2 ? (
              <fieldset className="ntx-landing-radio-set">
                <legend className="ntx-label">Which return will you file?</legend>
                {(
                  [
                    {
                      value: 'ITR2' as const,
                      label: 'ITR-2',
                      detail: 'Salary, house property, capital gains, other sources — no business P&L.',
                    },
                    {
                      value: 'ITR3' as const,
                      label: 'ITR-3',
                      detail: 'Includes business or profession income and accounts schedules.',
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={
                      data.form === option.value
                        ? 'ntx-landing-radio is-selected'
                        : 'ntx-landing-radio'
                    }
                  >
                    <input
                      type="radio"
                      name="landing-form"
                      value={option.value}
                      checked={data.form === option.value}
                      onChange={() => update('form', option.value)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <span>{option.detail}</span>
                    </span>
                  </label>
                ))}
                {errors.form ? <p className="ntx-field-error">{errors.form}</p> : null}
              </fieldset>
            ) : null}

            {errors.base ? <p className="ntx-field-error">{errors.base}</p> : null}
          </div>

          <div className="ntx-landing-form-actions">
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary"
              disabled={step === 0}
              onClick={() => goToStep(step - 1)}
            >
              Back
            </button>
            <button type="button" className="ntx-btn ntx-btn-primary" onClick={goNext}>
              {step === STEPS.length - 1 ? continueLabel : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
