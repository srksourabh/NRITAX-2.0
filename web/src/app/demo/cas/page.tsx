import { CasFetchDemo } from '@/components/demo/CasFetchDemo';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CasDemoPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="ntx-landing min-h-full">
        <header className="ntx-shell-header">
          <Link href="/" className="ntx-brand">
            NRITAX<span className="ntx-brand-version"> 2.0</span>
          </Link>
        </header>
        <main className="ntx-page py-16">
          <h1 className="ntx-display-lg text-[var(--ink)]">CAS fetch demo</h1>
          <p className="mt-4 max-w-xl text-[var(--text-secondary)]">
            Sign in to try DigiLocker auto-fill and specimen CAS fetch. Live Pro
            DigiLocker / CDSL uses <span className="ntx-figure">CASPARSER_API_KEY</span> in
            the filing wizard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?callbackUrl=/filing" className="ntx-btn ntx-btn-primary">
              Sign in to filing (Auto-fill)
            </Link>
            <Link href="/login?callbackUrl=/demo/cas" className="ntx-btn ntx-btn-secondary">
              Specimen CAS demo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <CasFetchDemo />;
}
