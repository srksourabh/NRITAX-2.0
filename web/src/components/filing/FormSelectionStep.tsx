'use client';

import { useState } from 'react';

import { FormChoiceCard } from '@/components/shell/AppShell';
import {
  FORM_SELECT_QUIZ,
  resolveFormQuizAnswer,
  type FormQuizAnswer,
} from '@/lib/itr/form-select-quiz';
import type { FormType } from '@/lib/itr/types';

type ChoosePhase = 'cards' | 'quiz' | 'resolved';

/**
 * Confident ITR-2 / ITR-3 opens immediately.
 * Questions appear only when the taxpayer chooses "I'm not sure".
 */
export function FormSelectionStep({
  busy,
  onOpenForm,
}: {
  busy?: boolean;
  onOpenForm: (form: FormType) => void;
}) {
  const [phase, setPhase] = useState<ChoosePhase>('cards');
  const [quizIndex, setQuizIndex] = useState(0);
  const [ambiguous, setAmbiguous] = useState(false);

  const question = FORM_SELECT_QUIZ[quizIndex];

  function startQuiz() {
    if (busy) return;
    setQuizIndex(0);
    setAmbiguous(false);
    setPhase('quiz');
  }

  function answerQuiz(answer: FormQuizAnswer) {
    if (!question) return;
    const result = resolveFormQuizAnswer(question, answer);
    if (result === 'ITR2' || result === 'ITR3') {
      onOpenForm(result);
      return;
    }
    if (result === 'ambiguous') {
      setAmbiguous(true);
      setPhase('resolved');
      return;
    }
    if (quizIndex + 1 < FORM_SELECT_QUIZ.length) {
      setQuizIndex((i) => i + 1);
      return;
    }
    setAmbiguous(true);
    setPhase('resolved');
  }

  function backToCards() {
    setPhase('cards');
    setQuizIndex(0);
    setAmbiguous(false);
  }

  if (phase === 'quiz' && question) {
    return (
      <main className="ntx-page">
        <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
          I&apos;m not sure · question {quizIndex + 1} of {FORM_SELECT_QUIZ.length}
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

  if (phase === 'resolved' && ambiguous) {
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
        Start a return
      </p>
      <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">Which form?</h1>
      <p className="mt-3 max-w-xl text-[var(--text-muted)]">
        Choose ITR-2 or ITR-3 if you already know — we open that form straight away. If you are not
        sure, we ask a few plain questions and route you.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <FormChoiceCard
          title="ITR-2"
          subtitle="No business or profession income this year. Salary, house property, capital gains, other sources."
          busy={busy}
          cta="Continue with ITR-2"
          onSelect={() => {
            if (!busy) onOpenForm('ITR2');
          }}
        />
        <FormChoiceCard
          title="ITR-3"
          subtitle="Business or profession income this year, including as a partner in a firm."
          busy={busy}
          cta="Continue with ITR-3"
          onSelect={() => {
            if (!busy) onOpenForm('ITR3');
          }}
        />
        <FormChoiceCard
          title="I'm not sure"
          subtitle="Answer a short set of questions. We route you to ITR-2 or ITR-3 from the facts."
          busy={busy}
          cta="Ask me questions"
          onSelect={startQuiz}
        />
      </div>
    </main>
  );
}
