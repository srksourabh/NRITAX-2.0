import Image from 'next/image';

import { BRAND_PHOTOS } from '@/lib/brand-imagery';

const STEPS = [
  {
    title: 'Enter PAN and portal password',
    text: 'Your e-Filing user ID is your PAN. Password stays in this browser tab for the session. Or create an Income Tax account first — we guide you.',
  },
  {
    title: 'Browser automation fetches prefill',
    text: 'We open the Income Tax portal, sign in, and pull the prefill JSON into your schedules. Manual upload remains the fallback.',
  },
  {
    title: 'Complete with Jukti Yukti',
    text: 'Fill remaining fields. The AI chartered accountant panel tells you what to fill, what to skip, and when to validate.',
  },
  {
    title: 'Validate, compare regimes, file',
    text: 'After each schedule: validation, tax, old vs new regime. Export JSON, then upload via automation or by hand on the portal.',
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="ntx-section" aria-labelledby="how-heading">
      <div className="ntx-shell">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="ntx-landing-kicker">How it works</p>
            <h2 id="how-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
              A guided flow from profile to filing readiness
            </h2>
            <p className="ntx-landing-section-lede">
              Portal password for this session, browser automation for prefill and filing, with
              Jukti Yukti guiding the schedules — and a manual path when automation cannot run.
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
                <span className="ntx-landing-step-no" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
