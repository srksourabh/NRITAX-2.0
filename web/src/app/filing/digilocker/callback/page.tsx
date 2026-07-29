import Link from 'next/link';

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
    <main className="ntx-page py-16">
      <h1 className="ntx-display-sm text-[var(--ink)]">DigiLocker return</h1>
      <p className="mt-3 max-w-lg text-[var(--text-secondary)]">
        Consent finished. Continue to the filing wizard to apply identity into Part A.
      </p>
      <Link href={filingHref} className="ntx-btn ntx-btn-primary mt-8">
        Continue to filing
      </Link>
    </main>
  );
}
