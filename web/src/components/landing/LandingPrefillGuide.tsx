import Image from 'next/image';

import { BRAND_PHOTOS } from '@/lib/brand-imagery';
import {
  ITD_PORTAL_HOME,
  ITD_PORTAL_LABEL,
  ITD_PORTAL_LOGIN,
} from '@/lib/itd/portal';

const STEPS = [
  {
    title: 'Open the e-Filing portal',
    text: `Go to the official ${ITD_PORTAL_LABEL} and sign in with your PAN and password (or Aadhaar OTP).`,
  },
  {
    title: 'Start an income-tax return',
    text: 'Choose e-File → Income Tax Returns → File Income Tax Return. Pick Assessment Year 2026-27 and ITR-2 or ITR-3.',
  },
  {
    title: 'Download the pre-filled JSON',
    text: 'When the portal offers Prefill / Download pre-filled data, download the JSON file to your device. Do not share your portal password with NRITAX 2.0.',
  },
  {
    title: 'Upload it in NRITAX 2.0',
    text: 'In the filing wizard, use Optional · ITD prefill JSON and select that file. Blank Part A and schedule fields fill where the JSON maps; you can edit everything afterwards.',
  },
] as const;

export function LandingPrefillGuide() {
  return (
    <section
      id="prefill"
      className="ntx-section ntx-landing-prefill ntx-landing-alt"
      aria-labelledby="prefill-heading"
    >
      <div className="ntx-shell">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="ntx-landing-kicker">Prefill from the department</p>
            <h2 id="prefill-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
              How to download the ITD JSON
            </h2>
            <p className="ntx-landing-section-lede">
              If you can sign in to the Income Tax portal, pull their pre-filled JSON and drop it
              into NRITAX 2.0. No portal password is ever collected here.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={ITD_PORTAL_HOME}
                target="_blank"
                rel="noopener noreferrer"
                className="ntx-btn ntx-btn-primary"
              >
                Open e-Filing portal
              </a>
              <a
                href={ITD_PORTAL_LOGIN}
                target="_blank"
                rel="noopener noreferrer"
                className="ntx-btn ntx-btn-secondary"
              >
                Portal login
              </a>
            </div>
            <figure className="ntx-landing-side-photo">
              <Image
                src={BRAND_PHOTOS.paperwork.src}
                alt={BRAND_PHOTOS.paperwork.alt}
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
