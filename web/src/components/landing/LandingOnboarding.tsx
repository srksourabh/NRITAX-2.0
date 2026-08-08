'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ITD_PORTAL_HOME, ITD_PORTAL_LABEL, ITD_PORTAL_LOGIN } from '@/lib/itd/portal';
import {
  FORM_SELECT_QUIZ,
  resolveFormQuizAnswer,
  type FormQuizAnswer,
} from '@/lib/itr/form-select-quiz';
import type { FormType } from '@/lib/itr/types';
import {
  isValidPan,
  normalizePan,
  writeFilingSession,
  type FilingAccessMode,
} from '@/lib/session/filing-session';

type FormPick = FormType | 'unsure' | '';

type Draft = {
  fullName: string;
  pan: string;
  password: string;
  accessMode: FilingAccessMode | '';
  formPick: FormPick;
  form: FormType | '';
  assessmentYear: string;
  politicallyExposed: 'yes' | 'no' | '';
  filingType: 'original' | 'revised' | 'belated' | 'updated';
  consentAutomation: boolean;
};

type Errors = Partial<Record<keyof Draft | 'base', string>>;

const STEPS = ['Identity', 'Portal access', 'Return details'] as const;

const empty: Draft = {
  fullName: '',
  pan: '',
  password: '',
  accessMode: '',
  formPick: '',
  form: '',
  assessmentYear: '2026-27',
  politicallyExposed: 'no',
  filingType: 'original',
  consentAutomation: false,
};

function validateStep(step: number, data: Draft): Errors {
  const errors: Errors = {};
  if (step === 0) {
    // Name is optional — portal login only needs PAN (User ID) + password + AY.
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
      if (!data.consentAutomation) {
        errors.consentAutomation =
          'Confirm we may use browser automation with this password for this session only.';
      }
    }
  }
  if (step === 2) {
    if (!data.formPick) errors.formPick = 'Select ITR-2, ITR-3, or I’m not sure.';
    if (data.formPick === 'unsure' && !data.form) {
      errors.form = 'Answer the questions so we can pick ITR-2 or ITR-3.';
    }
    if ((data.formPick === 'ITR2' || data.formPick === 'ITR3') && !data.form) {
      errors.form = 'Select ITR-2 or ITR-3.';
    }
    if (!/^\d{4}-\d{2}$/.test(data.assessmentYear)) {
      errors.assessmentYear = 'Select assessment year (for example 2026-27).';
    }
  }
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
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAmbiguous, setQuizAmbiguous] = useState(false);

  const update = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const pickForm = (pick: FormPick) => {
    setQuizIndex(0);
    setQuizAmbiguous(false);
    setData((prev) => ({
      ...prev,
      formPick: pick,
      form: pick === 'ITR2' || pick === 'ITR3' ? pick : '',
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.formPick;
      delete next.form;
      return next;
    });
  };

  const answerQuiz = (answer: FormQuizAnswer) => {
    const question = FORM_SELECT_QUIZ[quizIndex];
    if (!question) return;
    const result = resolveFormQuizAnswer(question, answer);
    if (result === 'ITR2' || result === 'ITR3') {
      setQuizAmbiguous(false);
      update('form', result);
      return;
    }
    if (result === 'ambiguous') {
      setQuizAmbiguous(true);
      update('form', '');
      return;
    }
    if (quizIndex + 1 < FORM_SELECT_QUIZ.length) {
      setQuizIndex((i) => i + 1);
      return;
    }
    setQuizAmbiguous(true);
    update('form', '');
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
    const form = (data.form || data.formPick) as FormType;
    try {
      writeFilingSession({
        fullName: data.fullName.trim() || 'TAXPAYER',
        pan,
        userId: pan,
        password: data.accessMode === 'has_password' ? data.password : undefined,
        accessMode: data.accessMode as FilingAccessMode,
        form,
        assessmentYear: data.assessmentYear,
        politicallyExposed: false,
        filingType: 'original',
        consentAutomation: data.accessMode === 'has_password' ? data.consentAutomation : false,
        savedAt: new Date().toISOString(),
      });
    } catch {
      setErrors({ base: 'Could not save this session in the browser. Check private-mode settings.' });
      return;
    }

    const href =
      data.accessMode === 'create_account'
        ? primaryHref === '/login'
          ? `/login?callbackUrl=${encodeURIComponent('/filing?guide=create-account')}`
          : `${primaryHref}${primaryHref.includes('?') ? '&' : '?'}guide=create-account`
        : primaryHref === '/login'
          ? `/login?callbackUrl=${encodeURIComponent('/filing?autoPrefill=1')}`
          : `${primaryHref}${primaryHref.includes('?') ? '&' : '?'}autoPrefill=1`;
    router.push(href);
  };

  const quizQuestion = FORM_SELECT_QUIZ[quizIndex];

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
                    On the {ITD_PORTAL_LABEL}, the user ID is always your PAN. Date of birth and
                    mobile can be filled later in your profile or when a form field needs them.
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
              <div className="space-y-5">
                <fieldset className="ntx-landing-radio-set">
                  <legend className="ntx-label">Which return will you file?</legend>
                  <p className="mb-2 text-[var(--caption)] text-[var(--text-muted)]">
                    If you already know, pick ITR-2 or ITR-3. Questions appear only if you choose
                    I&apos;m not sure.
                  </p>
                  {(
                    [
                      {
                        value: 'ITR2' as const,
                        label: 'ITR-2',
                        detail:
                          'Salary, house property, capital gains, other sources — no business P&L.',
                      },
                      {
                        value: 'ITR3' as const,
                        label: 'ITR-3',
                        detail: 'Includes business or profession income and accounts schedules.',
                      },
                      {
                        value: 'unsure' as const,
                        label: "I'm not sure",
                        detail: 'Answer a few plain questions and we route you.',
                      },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={
                        data.formPick === option.value
                          ? 'ntx-landing-radio is-selected'
                          : 'ntx-landing-radio'
                      }
                    >
                      <input
                        type="radio"
                        name="landing-form"
                        value={option.value}
                        checked={data.formPick === option.value}
                        onChange={() => pickForm(option.value)}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <span>{option.detail}</span>
                      </span>
                    </label>
                  ))}
                  {errors.formPick ? <p className="ntx-field-error">{errors.formPick}</p> : null}
                </fieldset>

                {data.formPick === 'unsure' ? (
                  <div className="ntx-panel space-y-3 p-4">
                    {quizAmbiguous ? (
                      <>
                        <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
                          Your answers are ambiguous. Pick a form deliberately to continue.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="ntx-btn ntx-btn-primary"
                            onClick={() => {
                              setQuizAmbiguous(false);
                              update('form', 'ITR2');
                            }}
                          >
                            Use ITR-2
                          </button>
                          <button
                            type="button"
                            className="ntx-btn ntx-btn-secondary"
                            onClick={() => {
                              setQuizAmbiguous(false);
                              update('form', 'ITR3');
                            }}
                          >
                            Use ITR-3
                          </button>
                        </div>
                      </>
                    ) : data.form ? (
                      <p className="text-[var(--body-sm)] text-[var(--ink)]">
                        Suggested form:{' '}
                        <strong>{data.form === 'ITR3' ? 'ITR-3' : 'ITR-2'}</strong>. You can continue,
                        or{' '}
                        <button
                          type="button"
                          className="font-semibold text-[var(--primary)] underline"
                          onClick={() => {
                            update('form', '');
                            setQuizIndex(0);
                            setQuizAmbiguous(false);
                          }}
                        >
                          ask again
                        </button>
                        .
                      </p>
                    ) : quizQuestion ? (
                      <>
                        <p className="text-[var(--caption)] font-semibold text-[var(--text-muted)] uppercase">
                          Question {quizIndex + 1} of {FORM_SELECT_QUIZ.length}
                        </p>
                        <p className="text-[var(--body)] text-[var(--ink)]">{quizQuestion.prompt}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="ntx-btn ntx-btn-primary"
                            onClick={() => answerQuiz('yes')}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className="ntx-btn ntx-btn-secondary"
                            onClick={() => answerQuiz('no')}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            className="ntx-btn ntx-btn-secondary"
                            onClick={() => answerQuiz('unsure')}
                          >
                            Not sure
                          </button>
                        </div>
                      </>
                    ) : null}
                    {errors.form ? <p className="ntx-field-error">{errors.form}</p> : null}
                  </div>
                ) : null}

                <div>
                  <label className="ntx-label" htmlFor="landing-ay">
                    Assessment year
                  </label>
                  <select
                    id="landing-ay"
                    className="ntx-input"
                    value={data.assessmentYear}
                    onChange={(e) => update('assessmentYear', e.target.value)}
                  >
                    <option value="2026-27">2026-27 (current)</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                  </select>
                  {errors.assessmentYear ? (
                    <p className="ntx-field-error">{errors.assessmentYear}</p>
                  ) : null}
                  <p className="mt-2 text-[var(--caption)] text-[var(--text-muted)]">
                    Portal automation always uses offline original filing and answers not
                    politically exposed.
                  </p>
                </div>
              </div>
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
