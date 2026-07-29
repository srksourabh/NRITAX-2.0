'use client';

import { LandingCta, LandingFooter } from './LandingCta';
import { LandingFeatures } from './LandingFeatures';
import { LandingHero } from './LandingHero';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingLedger } from './LandingLedger';
import { LandingNav } from './LandingNav';
import { LandingOnboarding } from './LandingOnboarding';
import { LandingPrefillGuide } from './LandingPrefillGuide';
import { LandingTrust } from './LandingTrust';

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  const primaryHref = signedIn ? '/filing' : '/login';
  const primaryLabel = signedIn ? 'Open the form' : 'Start filing';

  return (
    <div className="ntx-landing">
      <LandingNav primaryHref={primaryHref} primaryLabel={primaryLabel} />
      <main>
        <LandingHero primaryHref={primaryHref} primaryLabel={primaryLabel} />
        <LandingLedger />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPrefillGuide />
        <LandingTrust />
        {!signedIn ? <LandingOnboarding primaryHref={primaryHref} /> : null}
        <LandingCta primaryHref={primaryHref} primaryLabel={primaryLabel} />
      </main>
      <LandingFooter />
    </div>
  );
}
