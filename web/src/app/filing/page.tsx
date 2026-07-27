import { redirect } from 'next/navigation';

import { FilingWizard } from '@/components/filing/FilingWizard';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Migrations run from API routes / first DB touch. Calling PGlite migrate here
 * under the App Router RSC bundle hits a Turbopack path/URL bug on Windows;
 * auth alone is enough to gate the page.
 */
export default async function FilingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <FilingWizard />;
}
