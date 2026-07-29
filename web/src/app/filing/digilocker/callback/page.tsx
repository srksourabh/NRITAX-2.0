import Link from 'next/link';

import { AppShell } from '@/components/shell/AppShell';

export const dynamic = 'force-dynamic';

/**
 * DigiLocker / casparser redirect landing. Query params:
 * - Live: ?success=true&id={session_id}
 * - Mock: ?casparser_digilocker_mock=consent&casparser_session=...
 * Forwards into /filing with the same query so EnrichmentPanels can apply.
 */
export default async function DigilockerCallbackPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (typeof v === 'string' && v) q.set(key, v);
  }
  const filingHref = `/filing${q.toString() ? `?${q.toString()}` : ''}`;

  return (
    <AppShell>
      <main className="ntx-page py-16">
        <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
          DigiLocker
        </p>
        <h1 className="ntx-display-sm mt-3 text-[var(--ink)]">Consent finished</h1>
        <p className="mt-3 max-w-lg text-[var(--text-secondary)]">
          Continue to the filing wizard to apply identity into Part A. If nothing fills
          automatically, open Auto-fill and click Apply DigiLocker result.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={filingHref} className="ntx-btn ntx-btn-primary">
            Continue to filing
          </Link>
          <Link href="/" className="ntx-btn ntx-btn-secondary">
            Home
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
