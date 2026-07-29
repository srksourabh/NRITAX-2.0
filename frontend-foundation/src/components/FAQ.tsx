import { useState } from "react";

import { SectionReveal } from "./SectionReveal";

const faqs = [
  ["Does NRITAX 2.0 collect my Income Tax Department password?", "No. The onboarding flow only asks whether you have login credentials. It never asks for or stores your password."],
  ["Are the validation and JSON engines implemented in this frontend?", "No. The frontend calls mock service adapters. Sourabh Sir's backend engines should be connected later inside the services folder."],
  ["Is this ready for CA review workflows?", "Yes. The UI is structured so future CA-assisted review can be added without changing the first onboarding experience."],
  ["Can this support ERI or government portal filing later?", "Yes. The current structure leaves clear integration points for consent, validation, JSON preparation, CA review, and ERI filing."]
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-brand-surface px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionReveal className="text-center">
          <p className="text-caption uppercase tracking-wide text-brand-blue">FAQ</p>
          <h2 className="mt-3 font-heading text-section text-brand-ink">
            Clear answers for a high-trust product.
          </h2>
        </SectionReveal>
        <div className="mt-6 grid gap-3">
          {faqs.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div key={question} className="rounded-lg border border-brand-rule bg-white shadow-[0_1px_0_rgba(20,26,34,0.04)]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-heading text-card text-brand-ink hover:text-brand-blue focus-visible:outline-brand-blue sm:px-6"
                >
                  {question}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-brand-rule bg-brand-mist text-xl text-brand-blue">
                    {isOpen ? "-" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <div>
                    <p className="px-5 pb-5 text-body text-brand-muted sm:px-6">{answer}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
