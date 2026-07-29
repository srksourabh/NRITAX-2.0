import { LandingPage } from '@/components/landing/LandingPage';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  return <LandingPage signedIn={Boolean(session?.user)} />;
}
