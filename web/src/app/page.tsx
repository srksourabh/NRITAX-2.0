import { TestLoginButton } from '@/components/auth/TestLoginButton';
import { LandingPage } from '@/components/landing/LandingPage';
import { auth, readDemoAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  const demo = readDemoAuth();
  const testLogin =
    !signedIn && demo.enabled ? (
      <TestLoginButton className="ntx-btn-compact" label="Test login" />
    ) : null;

  return <LandingPage signedIn={signedIn} testLogin={testLogin} />;
}
