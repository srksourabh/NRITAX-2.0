import Image from 'next/image';

import { BRAND_PHOTOS } from '@/lib/brand-imagery';

const STEPS = [
  {
    title: 'Sign in without an Indian mobile',
    text: 'Email magic link or Google. No OTP to a number you no longer hold.',
  },
  {
    title: 'Choose ITR-2 or ITR-3',
    text: 'Each form is its own track. Schedules, validations and JSON stay separate.',
  },
  {
    title: 'Fill with optional helpers',
    text: 'Prefill, DigiLocker, OCR and CAS when you have them. Type by hand when you do not.',
  },
  {
    title: 'Validate and download',
    text: 'CBDT rules run on your figures. Download the departmental JSON and upload it on the official e-Filing portal.',
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="ntx-section" aria-labelledby="how-heading">
      <div className="ntx-shell">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="ntx-landing-kicker">How it works</p>
            <h2 id="how-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
              A guided flow from profile to filing readiness
            </h2>
            <p className="ntx-landing-section-lede">
              Four steps wired to the live wizard — not a mock — with room for calculation,
              documents, CA review and ERI later.
            </p>
            <figure className="ntx-landing-side-photo">
              <Image
                src={BRAND_PHOTOS.filingTaxes.src}
                alt={BRAND_PHOTOS.filingTaxes.alt}
                width={720}
                height={540}
                sizes="(max-width: 768px) 100vw, 28rem"
              />
            </figure>
          </div>
          <ol className="ntx-landing-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="ntx-landing-icon-well" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <div className="ntx-landing-step-bar" aria-hidden="true">
                  <span style={{ width: `${(index + 1) * 25}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
