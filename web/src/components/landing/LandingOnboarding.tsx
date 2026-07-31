'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RegimePref = 'new' | 'old' | '';
type CredentialStatus = 'yes' | 'no' | 'not-sure' | '';

type Draft = {
  fullName: string;
  country: string;
  pan: string;
  taxRegime: RegimePref;
  credentialStatus: CredentialStatus;
};

type Errors = Partial<Record<keyof Draft, string>>;

const STEPS = ['Personal', 'PAN', 'Regime', 'ITD access'] as const;

const empty: Draft = {
  fullName: '',
  country: '',
  pan: '',
  taxRegime: '',
  credentialStatus: '',
};

const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function normalizePan(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

function validateStep(step: number, data: Draft): Errors {
  const errors: Errors = {};
  if (step === 0) {
    if (data.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
    if (data.country.trim().length < 2) errors.country = 'Enter your country of residence.';
  }
  if (step === 1) {
    if (!data.pan.trim()) errors.pan = 'Enter your PAN.';
    else if (!panPattern.test(data.pan)) {
      errors.pan = 'PAN must be 10 characters, for example ABCDE1234F.';
    }
  }
  if (step === 2 && !data.taxRegime) errors.taxRegime = 'Select a regime preference.';
  if (step === 3 && !data.credentialStatus) {
    errors.credentialStatus = 'Tell us whether you can sign in to the Income Tax portal.';
  }
  return errors;
}

export function LandingOnboarding({
  primaryHref,
  continueLabel = 'Continue to sign in',
}: {
  primaryHref: string;
  continueLabel?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Errors>({});

  const update = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
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

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    try {
      localStorage.setItem(
        'nritax.landingDraft',
        JSON.stringify({
          ...data,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* ignore quota / private mode */
    }
    router.push(primaryHref);
  };

  return (
    <section id="start" className="ntx-section ntx-landing-anchor" aria-labelledby="start-heading">
      <div className="ntx-shell ntx-landing-onboard">
        <div className="ntx-landing-rise">
          <p className="ntx-landing-kicker">Start securely</p>
          <h2 id="start-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
            Begin a filing profile with clear security choices
          </h2>
          <p className="ntx-landing-section-lede">
            Four short questions. We keep the draft in this browser (local storage), then take
            you to sign-in so the filing wizard can open.
          </p>
          <div className="ntx-landing-security">
            <h3>Security note</h3>
            <p>
              Prefer downloading prefill JSON yourself on the Income Tax portal. If you later
              use optional automated fetch, the password is used only for that job over an
              encrypted connection and is wiped when the job ends — not stored for reuse.
            </p>
          </div>
        </div>

        <div className="ntx-landing-form ntx-landing-rise" aria-labelledby="onboarding-form-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[var(--body-sm)] font-semibold text-[var(--primary)]">
                Basic onboarding
              </p>
              <h3 id="onboarding-form-title" className="mt-1 text-[var(--h2)] font-semibold text-[var(--ink)]">
                Start your filing journey
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
                    aria-label={
                      canJumpBack
                        ? `Go back to ${label}`
                        : current
                          ? `${label}, current step`
                          : `${label}, not reached yet`
                    }
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
                    Full name
                  </label>
                  <input
                    id="landing-name"
                    className="ntx-input"
                    autoComplete="name"
                    value={data.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                  />
                  {errors.fullName ? (
                    <p className="ntx-field-error">{errors.fullName}</p>
                  ) : null}
                </div>
                <div>
                  <label className="ntx-label" htmlFor="landing-country">
                    Country of residence
                  </label>
                  <input
                    id="landing-country"
                    className="ntx-input"
                    autoComplete="country-name"
                    value={data.country}
                    onChange={(e) => update('country', e.target.value)}
                  />
                  {errors.country ? (
                    <p className="ntx-field-error">{errors.country}</p>
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <div>
                <label className="ntx-label" htmlFor="landing-pan">
                  PAN
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
                {errors.pan ? <p className="ntx-field-error">{errors.pan}</p> : null}
              </div>
            ) : null}

            {step === 2 ? (
              <fieldset className="ntx-landing-radio-set">
                <legend className="ntx-label">Regime preference</legend>
                {(
                  [
                    {
                      value: 'new' as const,
                      label: 'New regime',
                      detail: 'Section 115BAC slabs. Standard deduction, fewer Chapter VI-A claims.',
                    },
                    {
                      value: 'old' as const,
                      label: 'Old regime',
                      detail: 'Use deductions and exemptions where they still apply.',
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={
                      data.taxRegime === option.value
                        ? 'ntx-landing-radio is-selected'
                        : 'ntx-landing-radio'
                    }
                  >
                    <input
                      type="radio"
                      name="landing-regime"
                      value={option.value}
                      checked={data.taxRegime === option.value}
                      onChange={() => update('taxRegime', option.value)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <span>{option.detail}</span>
                    </span>
                  </label>
                ))}
                {errors.taxRegime ? (
                  <p className="ntx-field-error">{errors.taxRegime}</p>
                ) : null}
              </fieldset>
            ) : null}

            {step === 3 ? (
              <fieldset className="ntx-landing-radio-set">
                <legend className="ntx-label">
                  Can you sign in to the Income Tax portal?
                </legend>
                {(
                  [
                    { value: 'yes' as const, label: 'Yes' },
                    { value: 'no' as const, label: 'No' },
                    { value: 'not-sure' as const, label: 'Not sure' },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={
                      data.credentialStatus === option.value
                        ? 'ntx-landing-radio is-selected'
                        : 'ntx-landing-radio'
                    }
                  >
                    <input
                      type="radio"
                      name="landing-credentials"
                      value={option.value}
                      checked={data.credentialStatus === option.value}
                      onChange={() => update('credentialStatus', option.value)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                    </span>
                  </label>
                ))}
                <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
                  This only records whether you can reach the portal yourself. It is not a
                  password field.
                </p>
                {errors.credentialStatus ? (
                  <p className="ntx-field-error">{errors.credentialStatus}</p>
                ) : null}
              </fieldset>
            ) : null}
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
