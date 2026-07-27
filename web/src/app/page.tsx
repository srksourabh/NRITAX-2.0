import Link from 'next/link';

import { AppShell } from '@/components/shell/AppShell';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  const href = session?.user ? '/filing' : '/login';

  return (
    <AppShell
      right={
        <Link href={href} className="ntx-btn ntx-btn-primary">
          {session?.user ? 'Continue filing' : 'Sign in'}
        </Link>
      }
    >
      <main className="ntx-page flex flex-1 flex-col justify-center py-16">
        <p className="text-[var(--caption)] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
          AY 2026-27 · ITR-2 &amp; ITR-3
        </p>
        <h1 className="ntx-display-xl mt-4 text-[var(--ink)]">NRITAX</h1>
        <hr className="ntx-double-rule mt-8 max-w-md" />
        <p className="mt-6 max-w-xl text-[var(--h3)] text-[var(--text-secondary)]">
          File an Indian income tax return from anywhere. Prefill, CAS and Sandbox helpers are
          optional — enter figures by hand and download the JSON for the portal.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={href} className="ntx-btn ntx-btn-primary">
            {session?.user ? 'Open the form' : 'Start filing'}
          </Link>
          <a
            href="https://incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="ntx-btn ntx-btn-secondary"
          >
            Income Tax portal
          </a>
        </div>
      </main>
    </AppShell>
  );
}
