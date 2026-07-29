'use client';

import { useMemo, useState } from 'react';

import { FormChoiceCard } from '@/components/shell/AppShell';
import type { FormType } from '@/lib/itr/types';

/** Mirrors docs/itr-form-selection.md — FY label for copy. */
const FY_LABEL = '2025-26';

type ChoosePhase = 'cards' | 'killer' | 'quiz' | 'resolved';

type QuizAnswer = 'yes' | 'no' | 'unsure';

type QuizQuestion = {
  id: string;
  prompt: string;
  /** Immediate form if yes; undefined = continue */
  onYes?: FormType;
  /** Immediate form if no; undefined = continue */
  onNo?: FormType;
  /** Immediate form if unsure; undefined = continue */
  onUnsure?: FormType;
};

const QUIZ: QuizQuestion[] = [
  {
    id: 'partner',
    prompt: `Did you receive any income as a partner in a firm during FY ${FY_LABEL}?`,
    onYes: 'ITR3',
    onUnsure: 'ITR3',
  },
  {
    id: 'pgbp',
    prompt: `Did you run a business or profession in India this year (shop, consultancy billed as business, freelancing treated as profession, coaching, agency, etc.)?`,
    onYes: 'ITR3',
  },
  {
    id: 'presumptive',
    prompt:
      'Are you reporting (or required to report) income under a presumptive scheme such as sections 44AD, 44ADA, or 44AE?',
    onYes: 'ITR3',
  },
  {
    id: 'fno',
    prompt:
      'Did you have speculative business income or futures & options that you treat as business income (not only as capital gains)?',
    onYes: 'ITR3',
  },
  {
    id: 'windup',
    prompt: `Did a business or profession exist at any time in FY ${FY_LABEL}, even if you closed it before year-end?`,
    onYes: 'ITR3',
  },
  {
    id: 'salary_only',
    prompt:
      'Was your Indian income only from salary, house property, capital gains, and/or other sources (interest, dividends, etc.) — with no business or profession head?',
    onYes: 'ITR2',
  },
];

function resolveQuizAnswer(q: QuizQuestion, answer: QuizAnswer): FormType | 'continue' | 'ambiguous' {
  if (answer === 'yes' && q.onYes) return q.onYes;
  if (answer === 'no' && q.onNo) return q.onNo;
  if (answer === 'unsure' && q.onUnsure) return q.onUnsure;
  if (q.id === 'salary_only' && answer === 'no') return 'ambiguous';
  if (q.id === 'salary_only' && answer === 'unsure') return 'ambiguous';
  return 'continue';
}

export function FormSelectionStep({
  busy,
  onOpenForm,
}: {
  busy?: boolean;
  onOpenForm: (form: FormType) => void;
}) {
  const [phase, setPhase] = useState<ChoosePhase>('cards');
  const [pending, setPending] = useState<FormType | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [ambiguous, setAmbiguous] = useState(false);
  const [resolved, setResolved] = useState<FormType | null>(null);

  const question = QUIZ[quizIndex];

  const killerPrompt = useMemo(
    () =>
      `In FY ${FY_LABEL}, did you have income from a business or profession in India (including as a partner in a firm)?`,
    [],
  );

  function startKiller(form: FormType) {
    if (busy) return;
    setPending(form);
    setPhase('killer');
    setAmbiguous(false);
  }

  function startQuiz() {
    if (busy) return;
    setPending(null);
    setQuizIndex(0);
    setAmbiguous(false);
    setResolved(null);
    setPhase('quiz');
  }

  function passKiller() {
    if (!pending || busy) return;
    onOpenForm(pending);
  }

  function failKiller() {
    setQuizIndex(0);
    setAmbiguous(false);
    setPhase('quiz');
  }

  function answerKiller(answer: QuizAnswer) {
    if (!pending) return;
    if (answer === 'unsure') {
      failKiller();
      return;
    }
    const expectsBusiness = pending === 'ITR3';
    const saidYes = answer === 'yes';
    if (expectsBusiness === saidYes) passKiller();
    else failKiller();
  }

  function answerQuiz(answer: QuizAnswer) {
    if (!question) return;
    const result = resolveQuizAnswer(question, answer);
    if (result === 'ITR2' || result === 'ITR3') {
      setResolved(result);
      setPhase('resolved');
      return;
    }
    if (result === 'ambiguous') {
      setAmbiguous(true);
      setPhase('resolved');
      return;
    }
    if (quizIndex + 1 < QUIZ.length) {
      setQuizIndex((i) => i + 1);
      return;
    }
    setAmbiguous(true);
    setPhase('resolved');
  }

  function backToCards() {
    setPhase('cards');
    setPending(null);
    setQuizIndex(0);
    setAmbiguous(false);
    setResolved(null);
  }

  if (phase === 'killer' && pending) {
    return (
      <main className="ntx-page">
        <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
          Confirm · {pending === 'ITR2' ? 'ITR-2' : 'ITR-3'}
        </p>
        <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">One check before we open the form</h1>
        <p className="mt-4 max-w-xl text-[var(--h3)] text-[var(--ink)]">{killerPrompt}</p>
        <p className="mt-3 max-w-xl text-[var(--body-sm)] text-[var(--text-muted)]">
          Salary, house property, and capital gains alone are not business income. Mutual fund or
          share gains are usually capital gains, not business — unless you trade as a business.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="ntx-btn ntx-btn-primary"
            disabled={busy}
            onClick={() => answerKiller('yes')}
          >
            Yes
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={busy}
            onClick={() => answerKiller('no')}
          >
            No
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={busy}
            onClick={() => answerKiller('unsure')}
          >
            Not sure — ask me questions
          </button>
        </div>
        <button
          type="button"
          className="mt-6 text-[var(--body-sm)] font-semibold text-[var(--primary)]"
          onClick={backToCards}
        >
          Back to form choices
        </button>
      </main>
    );
  }

  if (phase === 'quiz' && question) {
    return (
      <main className="ntx-page">
        <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
          I’m not sure · question {quizIndex + 1} of {QUIZ.length}
        </p>
        <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">A few plain questions</h1>
        <p className="mt-4 max-w-xl text-[var(--h3)] text-[var(--ink)]">{question.prompt}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="ntx-btn ntx-btn-primary"
            disabled={busy}
            onClick={() => answerQuiz('yes')}
          >
            Yes
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={busy}
            onClick={() => answerQuiz('no')}
          >
            No
          </button>
          <button
            type="button"
            className="ntx-btn ntx-btn-secondary"
            disabled={busy}
            onClick={() => answerQuiz('unsure')}
          >
            Not sure
          </button>
        </div>
        <button
          type="button"
          className="mt-6 text-[var(--body-sm)] font-semibold text-[var(--primary)]"
          onClick={backToCards}
        >
          Back to form choices
        </button>
      </main>
    );
  }

  if (phase === 'resolved') {
    if (ambiguous || !resolved) {
      return (
        <main className="ntx-page">
          <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Needs a human call
          </p>
          <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">We cannot auto-pick the form</h1>
          <p className="mt-4 max-w-xl text-[var(--text-muted)]">
            Your answers are ambiguous for ITR-2 vs ITR-3. Pick a form deliberately, or confirm with
            a CA before filing. You can still open either track and enter figures by hand.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="ntx-btn ntx-btn-primary"
              disabled={busy}
              onClick={() => onOpenForm('ITR2')}
            >
              Open ITR-2 anyway
            </button>
            <button
              type="button"
              className="ntx-btn ntx-btn-secondary"
              disabled={busy}
              onClick={() => onOpenForm('ITR3')}
            >
              Open ITR-3 anyway
            </button>
            <button type="button" className="ntx-btn ntx-btn-secondary" onClick={backToCards}>
              Start over
            </button>
          </div>
        </main>
      );
    }

    return (
      <main className="ntx-page">
        <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
          Form decided
        </p>
        <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">
          {resolved === 'ITR2' ? 'ITR-2' : 'ITR-3'} fits your answers
        </h1>
        <p className="mt-4 max-w-xl text-[var(--text-muted)]">
          Prefill, CAS, DigiLocker and Sandbox helpers stay optional after you enter — nothing blocks
          manual entry. A later review can still flag if the filled return looks like the wrong form.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="ntx-btn ntx-btn-primary"
            disabled={busy}
            onClick={() => onOpenForm(resolved)}
          >
            {busy ? 'Opening…' : `Open ${resolved === 'ITR2' ? 'ITR-2' : 'ITR-3'}`}
          </button>
          <button type="button" className="ntx-btn ntx-btn-secondary" onClick={backToCards}>
            Start over
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ntx-page">
      <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
        Start a return
      </p>
      <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">Which form?</h1>
      <p className="mt-3 max-w-xl text-[var(--text-muted)]">
        Choose ITR-2 or ITR-3 if you already know. If you are not sure, we ask a few plain questions.
        After a direct pick we confirm business or profession income once — so a wrong track is caught
        early. Once the form opens, use <strong>Load Sample Data</strong> to fill a complete NRI
        specimen and download JSON, or use DigiLocker / CAS / Sandbox helpers to prefill your own.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <FormChoiceCard
          title="ITR-2"
          subtitle="No business or profession income this year. Salary, house property, capital gains, other sources."
          busy={busy}
          cta="Continue with ITR-2"
          onSelect={() => startKiller('ITR2')}
        />
        <FormChoiceCard
          title="ITR-3"
          subtitle="Business or profession income this year, including as a partner in a firm."
          busy={busy}
          cta="Continue with ITR-3"
          onSelect={() => startKiller('ITR3')}
        />
        <FormChoiceCard
          title="I’m not sure"
          subtitle="Answer a short set of questions. We route you to ITR-2 or ITR-3 from the facts."
          busy={busy}
          cta="Ask me questions"
          onSelect={startQuiz}
        />
      </div>
    </main>
  );
}
